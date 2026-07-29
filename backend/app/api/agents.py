from fastapi import APIRouter
from pydantic import BaseModel
from app.services.event_store import store
from app.models.event import generate_events
from app.database.connection import async_session_maker
from app.database.models import AgentRunDB
from sqlalchemy import select, func, desc

router = APIRouter(prefix="/api", tags=["Agents"])

AGENT_REGISTRY = [
    {"id": "coordinator", "name": "SOC Coordinator", "type": "coordinator", "description": "Central orchestration — triages events and routes to specialized agents"},
    {"id": "investigation", "name": "Investigation Agent", "type": "investigation", "description": "Deep-dive analysis of suspicious event sequences with evidence chain building"},
    {"id": "assessment", "name": "Assessment Agent", "type": "assessment", "description": "Static vulnerability assessment of application endpoints"},
    {"id": "identity", "name": "Identity Agent", "type": "identity", "description": "Detects brute force, credential stuffing, impossible travel, privilege escalation"},
    {"id": "endpoint", "name": "Endpoint Agent", "type": "endpoint", "description": "Monitors for suspicious process execution, unauthorized file access, malware indicators"},
    {"id": "database", "name": "Database Agent", "type": "database", "description": "Detects bulk data export, SQL injection patterns, unauthorized schema access"},
    {"id": "network", "name": "Network Agent", "type": "network", "description": "Analyzes lateral movement, C2 beaconing, DNS tunneling, port scanning"},
    {"id": "threat_intel", "name": "Threat Intel Agent", "type": "threat_intel", "description": "Cross-references IPs/domains against threat intelligence and MITRE ATT&CK mapping"},
    {"id": "policy", "name": "Policy Agent", "type": "policy", "description": "Evaluates events against banking security policies and compliance rules"},
]


class RunCycleResponse(BaseModel):
    message: str
    events: list[dict]
    stats: dict


@router.post("/run-cycle", response_model=RunCycleResponse)
async def run_detection_cycle():
    """Simulate a full AI agent detection cycle generating new telemetry events."""
    new_events = generate_events(5)
    await store.add_many(new_events)
    stats = await store.stats()
    return RunCycleResponse(
        message="Agent detection cycle complete. 5 new events analysed.",
        events=[e.model_dump() for e in new_events],
        stats=stats,
    )


@router.get("/agents/status", tags=["Agents"])
async def agents_status():
    """Return all registered agents with real run counts."""
    async with async_session_maker() as session:
        # Get run counts per agent
        rows = (await session.execute(
            select(AgentRunDB.agent_name, func.count(AgentRunDB.run_id).label("count"))
            .group_by(AgentRunDB.agent_name)
        )).all()
        run_counts = {r[0]: r[1] for r in rows}

    agents = []
    for agent in AGENT_REGISTRY:
        agent_key = agent["id"] + "_agent" if agent["id"] not in ["coordinator", "investigation", "assessment"] else agent["id"] + "_agent"
        count = run_counts.get(agent_key, 0)
        status = "active" if count > 0 else "idle"
        agents.append({
            **agent,
            "status": status,
            "eventsProcessed": count,
        })
    return agents


@router.get("/agents/runs")
async def agent_runs(limit: int = 50):
    """List recent agent runs with timing info."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(AgentRunDB).order_by(desc(AgentRunDB.created_at)).limit(limit)
        )
        runs = result.scalars().all()
        return [
            {
                "run_id": r.run_id,
                "agent_name": r.agent_name,
                "trigger_event_id": r.trigger_event_id,
                "status": r.status,
                "result": r.result,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in runs
        ]


@router.get("/agents/{name}/stats")
async def agent_stats(name: str):
    """Agent-specific metrics."""
    async with async_session_maker() as session:
        total = (await session.execute(
            select(func.count(AgentRunDB.run_id)).where(AgentRunDB.agent_name == name)
        )).scalar() or 0
    return {"agent_name": name, "total_runs": total}
