from fastapi import APIRouter

router = APIRouter()

@router.post("/telemetry", tags=["Agents"])
async def ingest(event: dict):
    # Placeholder – forward to service layer
    return {"received": True}
