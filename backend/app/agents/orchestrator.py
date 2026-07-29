import uuid
import datetime
from collections import defaultdict
import asyncio
from app.models.event import SecurityEvent
from app.models.finding import Finding
from app.models.incident import Incident
from app.agents.coordinator_agent import evaluate_event
from app.agents.investigation_agent import investigate_events
from app.agents.identity_agent import analyze_identity_events
from app.agents.endpoint_agent import analyze_endpoint_events
from app.agents.database_agent import analyze_database_events
from app.agents.network_agent import analyze_network_events
from app.agents.threat_intel_agent import analyze_threat_intel
from app.agents.policy_agent import analyze_policy_events
from app.risk.risk_engine import risk_engine
from app.database.connection import async_session_maker
from app.database.models import IncidentDB, AgentRunDB
from sqlalchemy import select

class Orchestrator:
    def __init__(self):
        # Simple in-memory correlation buffer (user/ip -> events)
        self.user_buffer = defaultdict(list)
        self.ip_buffer = defaultdict(list)
        
    async def process_event(self, event: SecurityEvent):
        # 1. Update correlation buffers
        if event.user_id:
            self.user_buffer[event.user_id].append(event)
            # Keep last 10 events for context
            self.user_buffer[event.user_id] = self.user_buffer[event.user_id][-10:]
        if event.ip_address:
            self.ip_buffer[event.ip_address].append(event)
            self.ip_buffer[event.ip_address] = self.ip_buffer[event.ip_address][-10:]

        # Context events for analysis
        context_events = []
        if event.user_id:
            context_events.extend(self.user_buffer[event.user_id])
        elif event.ip_address:
            context_events.extend(self.ip_buffer[event.ip_address])
        else:
            context_events = [event]
            
        # Deduplicate context events
        context_events = list({e.event_id: e for e in context_events}.values())
        
        # 2. Coordinator decides routing
        decision = await evaluate_event(event)
        
        await self._log_agent_run("coordinator_agent", event.event_id, decision.model_dump())
            
        # 3. Route to specialized agents based on event type or coordinator decision
        tasks = []
        
        # Always run Policy and Threat Intel
        tasks.append(self._run_and_log(analyze_policy_events, context_events, "policy_agent", event.event_id))
        tasks.append(self._run_and_log(analyze_threat_intel, context_events, "threat_intel_agent", event.event_id))
        
        # Specialized routing
        if event.source == "IAM" or event.event_type in ["login_failure", "login_success", "privilege_escalation"]:
            tasks.append(self._run_and_log(analyze_identity_events, context_events, "identity_agent", event.event_id))
        elif event.source == "EDR":
            tasks.append(self._run_and_log(analyze_endpoint_events, context_events, "endpoint_agent", event.event_id))
        elif event.source == "Database Audit":
            tasks.append(self._run_and_log(analyze_database_events, context_events, "database_agent", event.event_id))
        elif event.source == "Network Monitor":
            tasks.append(self._run_and_log(analyze_network_events, context_events, "network_agent", event.event_id))
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check if any specialized agent found something suspicious
        is_suspicious = decision.is_suspicious
        detected_tactics = []
        detected_techniques = []
        
        for res in results:
            if isinstance(res, dict) and "is_suspicious" in res and res["is_suspicious"]:
                is_suspicious = True
                if "detected_tactics" in res:
                    detected_tactics.extend(res["detected_tactics"])
                if "detected_techniques" in res:
                    detected_techniques.extend(res["detected_techniques"])
                    
        detected_tactics = list(set(detected_tactics))
        detected_techniques = list(set(detected_techniques))
        
        # 4. Investigate if suspicious
        if is_suspicious:
            await self._run_investigation(event, context_events, detected_tactics, detected_techniques)
            
    async def _run_and_log(self, agent_func, events, agent_name, trigger_id):
        try:
            result = await agent_func(events)
            dump = result.model_dump() if result else {}
            await self._log_agent_run(agent_name, trigger_id, dump)
            return dump
        except Exception as e:
            print(f"Error running {agent_name}: {e}")
            return {}

    async def _log_agent_run(self, agent_name, trigger_id, result):
        async with async_session_maker() as session:
            session.add(AgentRunDB(
                agent_name=agent_name,
                trigger_event_id=trigger_id,
                result=result
            ))
            await session.commit()
            
    async def _run_investigation(self, trigger_event: SecurityEvent, context_events: list[SecurityEvent], tactics: list[str], techniques: list[str]):
        # Mock finding for context
        related_findings = [Finding(
            title="Potential Vulnerability",
            category="General",
            description="Mock finding for investigation context",
            severity="High",
            affected_endpoint=trigger_event.endpoint,
            risk_score=85
        )]
        
        investigation = await investigate_events(context_events, related_findings)
        
        if investigation:
            await self._log_agent_run("investigation_agent", trigger_event.event_id, investigation.model_dump())
            
            # Calculate Risk
            ctx_risk = risk_engine.calculate_contextual_risk(related_findings[0], context_events)
            
            # Create Incident
            async with async_session_maker() as session:
                inc = IncidentDB(
                    title=f"Incident: {investigation.incident_summary[:50]}...",
                    summary=investigation.incident_summary,
                    risk_score=ctx_risk,
                    recommendation=investigation.recommended_action,
                    ai_explanation=investigation.ai_explanation,
                    mitre_tactics=tactics,
                    mitre_techniques=techniques,
                    related_event_ids=[e.event_id for e in context_events],
                    evidence_chain=investigation.evidence
                )
                session.add(inc)
                await session.commit()
                # Broadcast incident here in future steps

orchestrator = Orchestrator()
