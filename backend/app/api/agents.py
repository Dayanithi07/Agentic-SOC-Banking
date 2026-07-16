from fastapi import APIRouter
from pydantic import BaseModel
from app.services.event_store import store
from app.models.event import generate_events

router = APIRouter(prefix="/api", tags=["Agents"])

class RunCycleResponse(BaseModel):
    message: str
    events:  list[dict]
    stats:   dict

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
    return [
        {"id": "1", "name": "SOC Coordinator", "status": "active", "eventsProcessed": 1842},
        {"id": "2", "name": "IAM Agent",        "status": "active", "eventsProcessed": 543},
        {"id": "3", "name": "EDR Agent",         "status": "active", "eventsProcessed": 329},
        {"id": "4", "name": "Network Agent",     "status": "busy",   "eventsProcessed": 2104},
        {"id": "5", "name": "Firewall Agent",    "status": "idle",   "eventsProcessed": 891},
        {"id": "6", "name": "PAM Agent",         "status": "active", "eventsProcessed": 217},
    ]
