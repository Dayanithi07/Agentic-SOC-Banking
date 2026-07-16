from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import chat
from app.services.event_store import store

router = APIRouter(prefix="/api", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None

class ChatResponse(BaseModel):
    response: str
    agent:    str = "SOC Coordinator"

@router.post("/chat", response_model=ChatResponse)
async def soc_chat(body: ChatRequest):
    # Enrich context with live stats
    stats = await store.stats()
    context = (
        f"[LIVE CONTEXT] Total events: {stats['total_events']}, "
        f"Critical: {stats['critical_alerts']}, "
        f"Avg risk: {stats['avg_risk_score']}/100, "
        f"Active agents: {stats['active_agents']}. "
    )
    full_message = context + body.message
    response = await chat(full_message, body.history)
    return ChatResponse(response=response)
