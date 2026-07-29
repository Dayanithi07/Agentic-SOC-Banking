from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.database.connection import async_session_maker
from app.database.models import IncidentDB, AgentRunDB
from sqlalchemy import select, desc
from datetime import datetime

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("")
async def get_incidents():
    async with async_session_maker() as session:
        result = await session.execute(select(IncidentDB).order_by(IncidentDB.created_at.desc()).limit(100))
        incidents = result.scalars().all()
        return [
            {
                "incident_id": i.incident_id,
                "title": i.title,
                "summary": i.summary,
                "risk_score": i.risk_score,
                "status": i.status,
                "recommendation": i.recommendation,
                "ai_explanation": i.ai_explanation,
                "mitre_tactics": i.mitre_tactics or [],
                "mitre_techniques": i.mitre_techniques or [],
                "related_event_ids": i.related_event_ids or [],
                "related_finding_ids": i.related_finding_ids or [],
                "evidence_chain": i.evidence_chain or [],
                "created_at": i.created_at.isoformat() if i.created_at else None,
                "updated_at": i.updated_at.isoformat() if i.updated_at else None,
            }
            for i in incidents
        ]


@router.get("/by-event/{event_id}")
async def get_incident_by_event(event_id: str):
    """Find incident linked to a specific event."""
    async with async_session_maker() as session:
        result = await session.execute(select(IncidentDB).order_by(IncidentDB.created_at.desc()).limit(200))
        for i in result.scalars().all():
            if event_id in (i.related_event_ids or []):
                return {
                    "incident_id": i.incident_id,
                    "title": i.title,
                    "summary": i.summary,
                    "risk_score": i.risk_score,
                    "status": i.status,
                    "recommendation": i.recommendation,
                    "ai_explanation": i.ai_explanation,
                    "mitre_tactics": i.mitre_tactics or [],
                    "mitre_techniques": i.mitre_techniques or [],
                    "evidence_chain": i.evidence_chain or [],
                }
    return {"error": "No incident found for this event"}


@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str):
    async with async_session_maker() as session:
        result = await session.execute(
            select(IncidentDB).where(IncidentDB.incident_id == incident_id)
        )
        i = result.scalar_one_or_none()
        if not i:
            return {"error": "Incident not found"}
        return {
            "incident_id": i.incident_id,
            "title": i.title,
            "summary": i.summary,
            "risk_score": i.risk_score,
            "status": i.status,
            "recommendation": i.recommendation,
            "ai_explanation": i.ai_explanation,
            "mitre_tactics": i.mitre_tactics or [],
            "mitre_techniques": i.mitre_techniques or [],
            "related_event_ids": i.related_event_ids or [],
            "related_finding_ids": i.related_finding_ids or [],
            "evidence_chain": i.evidence_chain or [],
            "created_at": i.created_at.isoformat() if i.created_at else None,
            "updated_at": i.updated_at.isoformat() if i.updated_at else None,
        }


class StatusUpdate(BaseModel):
    status: str  # acknowledged, investigating, resolved, false_positive


@router.patch("/{incident_id}/status")
async def update_incident_status(incident_id: str, body: StatusUpdate):
    async with async_session_maker() as session:
        result = await session.execute(
            select(IncidentDB).where(IncidentDB.incident_id == incident_id)
        )
        incident = result.scalar_one_or_none()
        if not incident:
            return {"error": "Incident not found"}
        incident.status = body.status
        incident.updated_at = datetime.utcnow()
        await session.commit()
        return {"message": f"Incident {incident_id} status updated to {body.status}"}


@router.get("/agent_runs")
async def get_agent_runs():
    async with async_session_maker() as session:
        result = await session.execute(select(AgentRunDB).order_by(AgentRunDB.created_at.desc()).limit(100))
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
