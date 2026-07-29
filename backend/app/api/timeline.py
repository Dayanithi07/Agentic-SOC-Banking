from fastapi import APIRouter
from app.database.connection import async_session_maker
from app.database.models import SecurityEventDB, IncidentDB
from sqlalchemy import select, desc

router = APIRouter(prefix="/api/timeline", tags=["Timeline"])


@router.get("/incident/{incident_id}")
async def incident_timeline(incident_id: str):
    """Returns ordered event chain for an incident investigation."""
    async with async_session_maker() as session:
        # Get incident
        inc_result = await session.execute(
            select(IncidentDB).where(IncidentDB.incident_id == incident_id)
        )
        incident = inc_result.scalar_one_or_none()
        if not incident:
            return {"error": "Incident not found"}

        # Get related events
        event_ids = incident.related_event_ids or []
        events = []
        if event_ids:
            ev_result = await session.execute(
                select(SecurityEventDB)
                .where(SecurityEventDB.event_id.in_(event_ids))
                .order_by(SecurityEventDB.timestamp)
            )
            events = [
                {
                    "event_id": e.event_id,
                    "timestamp": e.timestamp,
                    "event_type": e.event_type,
                    "severity": e.severity,
                    "source": e.source,
                    "user_id": e.user_id,
                    "ip_address": e.ip_address,
                    "endpoint": e.endpoint,
                    "mitre_tactic": e.mitre_tactic,
                    "mitre_technique": e.mitre_technique,
                }
                for e in ev_result.scalars().all()
            ]

        return {
            "incident_id": incident_id,
            "title": incident.title,
            "summary": incident.summary,
            "risk_score": incident.risk_score,
            "status": incident.status,
            "mitre_tactics": incident.mitre_tactics,
            "mitre_techniques": incident.mitre_techniques,
            "evidence_chain": incident.evidence_chain,
            "ai_explanation": incident.ai_explanation,
            "recommendation": incident.recommendation,
            "timeline": events,
        }


@router.get("/user/{user_id}")
async def user_timeline(user_id: str, limit: int = 50):
    """Returns user activity timeline."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(SecurityEventDB)
            .where(SecurityEventDB.user_id == user_id)
            .order_by(desc(SecurityEventDB.timestamp))
            .limit(limit)
        )
        events = [
            {
                "event_id": e.event_id,
                "timestamp": e.timestamp,
                "event_type": e.event_type,
                "severity": e.severity,
                "source": e.source,
                "endpoint": e.endpoint,
                "ip_address": e.ip_address,
                "mitre_tactic": e.mitre_tactic,
                "mitre_technique": e.mitre_technique,
            }
            for e in result.scalars().all()
        ]
    return {"user_id": user_id, "events": events}
