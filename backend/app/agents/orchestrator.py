import datetime
from collections import defaultdict
import asyncio
from app.api.websocket import broadcast_incident, broadcast_agent_activity
from app.models.event import SecurityEvent
from app.models.finding import Finding
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

IDENTITY_TYPES = {
    "login_failure", "login_success", "privilege_escalation",
    "session_hijack_attempt", "account_disabled",
}
DATABASE_TYPES = {"sql_injection_attempt", "data_export", "schema_access"}
NETWORK_TYPES = {"lateral_movement", "ip_blocked", "dns_tunnel", "port_scan", "c2_beacon"}


class Orchestrator:
    def __init__(self):
        self.user_buffer = defaultdict(list)
        self.ip_buffer = defaultdict(list)
        self._recent_incidents: dict[str, float] = {}

    async def process_event(self, event: SecurityEvent):
        if event.user_id:
            self.user_buffer[event.user_id].append(event)
            self.user_buffer[event.user_id] = self.user_buffer[event.user_id][-15:]
        if event.ip_address:
            self.ip_buffer[event.ip_address].append(event)
            self.ip_buffer[event.ip_address] = self.ip_buffer[event.ip_address][-15:]

        context_events = []
        if event.user_id:
            context_events.extend(self.user_buffer[event.user_id])
        if event.ip_address:
            context_events.extend(self.ip_buffer[event.ip_address])
        if not context_events:
            context_events = [event]

        context_events = list({e.event_id: e for e in context_events}.values())
        context_events.sort(key=lambda e: e.timestamp)

        decision = await evaluate_event(event)
        await self._log_agent_run("coordinator_agent", event.event_id, decision.model_dump())

        tasks = [
            self._run_and_log(analyze_policy_events, context_events, "policy_agent", event.event_id),
            self._run_and_log(analyze_threat_intel, context_events, "threat_intel_agent", event.event_id),
        ]

        if event.source == "IAM" or event.event_type in IDENTITY_TYPES:
            tasks.append(self._run_and_log(analyze_identity_events, context_events, "identity_agent", event.event_id))
        if event.source == "EDR":
            tasks.append(self._run_and_log(analyze_endpoint_events, context_events, "endpoint_agent", event.event_id))
        if event.source == "Database Audit" or event.event_type in DATABASE_TYPES:
            tasks.append(self._run_and_log(analyze_database_events, context_events, "database_agent", event.event_id))
        if event.source == "Network Monitor" or event.event_type in NETWORK_TYPES:
            tasks.append(self._run_and_log(analyze_network_events, context_events, "network_agent", event.event_id))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        is_suspicious = decision.is_suspicious
        detected_tactics = []
        detected_techniques = []
        agent_reasoning = []

        if event.mitre_tactic:
            detected_tactics.append(event.mitre_tactic)
        if event.mitre_technique:
            detected_techniques.append(event.mitre_technique)

        for res in results:
            if isinstance(res, dict):
                if res.get("is_suspicious"):
                    is_suspicious = True
                detected_tactics.extend(res.get("detected_tactics") or [])
                detected_techniques.extend(res.get("detected_techniques") or [])
                if res.get("reasoning"):
                    agent_reasoning.append(res["reasoning"])

        detected_tactics = list(dict.fromkeys(detected_tactics))
        detected_techniques = list(dict.fromkeys(detected_techniques))

        if is_suspicious:
            await self._run_investigation(
                event, context_events, detected_tactics, detected_techniques, agent_reasoning
            )

    async def _run_and_log(self, agent_func, events, agent_name, trigger_id):
        try:
            result = await agent_func(events)
            dump = result.model_dump() if result else {}
            await self._log_agent_run(agent_name, trigger_id, dump)
            await broadcast_agent_activity(agent_name, trigger_id, dump)
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

    def _dedup_key(self, trigger_event: SecurityEvent, context_events: list[SecurityEvent]) -> str:
        types = sorted({e.event_type for e in context_events})
        return f"{trigger_event.user_id or trigger_event.ip_address}:{':'.join(types[:3])}"

    async def _run_investigation(
        self,
        trigger_event: SecurityEvent,
        context_events: list[SecurityEvent],
        tactics: list[str],
        techniques: list[str],
        agent_reasoning: list[str],
    ):
        dedup = self._dedup_key(trigger_event, context_events)
        now = datetime.datetime.utcnow().timestamp()
        if dedup in self._recent_incidents and now - self._recent_incidents[dedup] < 30:
            return
        self._recent_incidents[dedup] = now

        related_findings = self._build_findings(trigger_event, context_events, agent_reasoning)
        investigation = await investigate_events(context_events, related_findings, agent_reasoning)

        if not investigation:
            return

        await self._log_agent_run("investigation_agent", trigger_event.event_id, investigation.model_dump())

        ctx_risk = risk_engine.calculate_contextual_risk(related_findings[0], context_events)

        async with async_session_maker() as session:
            inc = IncidentDB(
                title=self._incident_title(trigger_event, context_events),
                summary=investigation.incident_summary,
                risk_score=ctx_risk,
                recommendation=investigation.recommended_action,
                ai_explanation=investigation.ai_explanation,
                mitre_tactics=tactics,
                mitre_techniques=techniques,
                related_event_ids=[e.event_id for e in context_events],
                evidence_chain=investigation.evidence,
            )
            session.add(inc)
            await session.commit()
            await broadcast_incident({
                "incident_id": inc.incident_id,
                "title": inc.title,
                "summary": inc.summary,
                "risk_score": ctx_risk,
                "status": "new",
                "mitre_tactics": tactics,
                "mitre_techniques": techniques,
                "ai_explanation": investigation.ai_explanation,
                "recommendation": investigation.recommended_action,
                "evidence_chain": investigation.evidence,
                "attack_sequence": investigation.attack_sequence,
                "related_event_ids": [e.event_id for e in context_events],
            })

    def _incident_title(self, trigger: SecurityEvent, events: list[SecurityEvent]) -> str:
        attack_types = {e.event_type for e in events if e.severity in ("critical", "high")}
        if "access_control_violation" in attack_types:
            return "IDOR / Access Control Violation Detected"
        if "sql_injection_attempt" in attack_types:
            return "SQL Injection Attack Detected"
        if "login_failure" in attack_types and any(e.event_type == "data_export" for e in events):
            return "Credential Stuffing & Data Exfiltration"
        if "login_failure" in attack_types:
            return "Brute Force / Credential Attack"
        if "lateral_movement" in attack_types:
            return "Insider Threat — Lateral Movement"
        if "privilege_escalation" in attack_types:
            return "Privilege Escalation Incident"
        if trigger.event_type:
            return f"Security Incident: {trigger.event_type.replace('_', ' ').title()}"
        return "Security Incident Detected"

    def _build_findings(
        self,
        trigger: SecurityEvent,
        events: list[SecurityEvent],
        agent_reasoning: list[str],
    ) -> list[Finding]:
        findings = []
        event_types = {e.event_type for e in events}

        if "access_control_violation" in event_types:
            findings.append(Finding(
                title="Insecure Direct Object Reference (IDOR)",
                category="Access Control",
                description=f"Unauthorized access attempt to resource {trigger.endpoint or '/api/orders'} by user {trigger.user_id or 'unknown'}",
                severity="Critical",
                affected_endpoint=trigger.endpoint,
                risk_score=94,
            ))

        if "sql_injection_attempt" in event_types:
            payloads = [
                e.metadata.get("payload", "")
                for e in events if e.event_type == "sql_injection_attempt" and e.metadata
            ]
            findings.append(Finding(
                title="SQL Injection Vulnerability Exploited",
                category="Injection",
                description=f"Multiple SQL injection probes detected on {trigger.endpoint or 'API endpoints'}. Payloads: {', '.join(filter(None, payloads[:3])) or 'unknown'}",
                severity="Critical",
                affected_endpoint=trigger.endpoint,
                risk_score=95,
            ))

        if "login_failure" in event_types and sum(1 for e in events if e.event_type == "login_failure") >= 3:
            findings.append(Finding(
                title="Brute Force / Credential Stuffing",
                category="Authentication",
                description=f"Repeated login failures from IP {trigger.ip_address} targeting user {trigger.user_id}",
                severity="High",
                affected_endpoint="/api/auth/login",
                risk_score=88,
            ))

        if "data_export" in event_types:
            total = sum(
                (e.metadata or {}).get("records_exported", 0)
                for e in events if e.event_type == "data_export"
            )
            findings.append(Finding(
                title="Bulk Data Exfiltration",
                category="Exfiltration",
                description=f"Large-scale data export detected: ~{total:,} records exported",
                severity="Critical",
                affected_endpoint=trigger.endpoint,
                risk_score=92,
            ))

        if "lateral_movement" in event_types:
            targets = [
                (e.metadata or {}).get("target_host", e.endpoint)
                for e in events if e.event_type == "lateral_movement"
            ]
            findings.append(Finding(
                title="Lateral Movement Across Internal Hosts",
                category="Lateral Movement",
                description=f"Insider lateral movement to: {', '.join(filter(None, targets)) or 'internal systems'}",
                severity="High",
                affected_endpoint=trigger.endpoint,
                risk_score=87,
            ))

        if not findings:
            findings.append(Finding(
                title=f"Suspicious Activity: {trigger.event_type}",
                category="General",
                description=agent_reasoning[0] if agent_reasoning else f"Anomalous {trigger.event_type} from {trigger.source}",
                severity="High" if trigger.severity in ("critical", "high") else "Medium",
                affected_endpoint=trigger.endpoint,
                risk_score=75,
            ))

        return findings


orchestrator = Orchestrator()
