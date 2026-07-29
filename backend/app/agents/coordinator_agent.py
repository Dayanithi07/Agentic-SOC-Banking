from typing import Optional
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent
from app.models.finding import Finding
from pydantic import BaseModel

class CoordinatorDecision(BaseModel):
    is_suspicious: bool
    reason: str
    target_agent: Optional[str]

async def evaluate_event(event: SecurityEvent) -> CoordinatorDecision:
    prompt = f"""
    You are the Coordinator Agent.
    Evaluate the following security event:
    {event.model_dump()}
    
    Is it suspicious? Which agent should handle it next?
    Options for target_agent: 'investigation_agent', 'assessment_agent', or null.
    """
    
    decision = await generate_structured_response(prompt, CoordinatorDecision)
    
    if not decision:
        is_susp = event.severity in ["high", "critical"] or "failure" in event.event_type or "violation" in event.event_type
        decision = CoordinatorDecision(
            is_suspicious=is_susp,
            reason="Heuristic evaluation fallback",
            target_agent="investigation_agent" if is_susp else None
        )
        
    return decision
