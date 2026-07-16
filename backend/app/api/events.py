from fastapi import APIRouter, Query
from app.services.event_store import store
from app.models.event import TelemetryEvent

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=list[TelemetryEvent])
async def get_events(
    limit: int = Query(50, ge=1, le=200),
    severity: str | None = Query(None),
):
    if severity:
        return await store.get_by_severity(severity, limit)
    return await store.get_all(limit)

@router.get("/stats")
async def get_stats():
    return await store.stats()
