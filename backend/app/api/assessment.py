from fastapi import APIRouter
from app.assessment.scanner import run_assessment
from app.models.finding import Finding
from app.database.connection import async_session_maker
from app.database.models import FindingDB
from sqlalchemy import select

router = APIRouter(prefix="/api", tags=["Assessment"])

@router.post("/assessment/run", response_model=list[Finding])
async def trigger_assessment():
    return await run_assessment()

@router.get("/findings", response_model=list[Finding])
async def get_findings():
    async with async_session_maker() as session:
        result = await session.execute(select(FindingDB))
        db_findings = result.scalars().all()
        return [
            Finding(
                finding_id=f.finding_id,
                title=f.title,
                category=f.category,
                description=f.description,
                severity=f.severity,
                affected_endpoint=f.affected_endpoint,
                evidence=f.evidence,
                risk_score=f.risk_score,
                status=f.status
            ) for f in db_findings
        ]
