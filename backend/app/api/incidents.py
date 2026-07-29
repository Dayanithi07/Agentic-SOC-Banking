from fastapi import APIRouter
from app.database.connection import async_session_maker
from app.database.models import IncidentDB, AgentRunDB
from sqlalchemy import select

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

@router.get("")
async def get_incidents():
    async with async_session_maker() as session:
        result = await session.execute(select(IncidentDB).order_by(IncidentDB.created_at.desc()))
        incidents = result.scalars().all()
        return incidents

@router.get("/agent_runs")
async def get_agent_runs():
    async with async_session_maker() as session:
        result = await session.execute(select(AgentRunDB).order_by(AgentRunDB.created_at.desc()))
        runs = result.scalars().all()
        return runs
