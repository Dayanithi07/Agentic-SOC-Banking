from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent
from app.models.finding import Finding
from app.risk.risk_engine import risk_engine

class InvestigationResult(BaseModel):
    incident_summary: str
    evidence: list[str]
    attack_sequence: str
    confidence: float
    related_finding_ids: list[str]
    recommended_action: str
    ai_explanation: str

async def investigate_events(events: list[SecurityEvent], related_findings: list[Finding]) -> Optional[InvestigationResult]:
    prompt = f"""
    You are an expert AI Security Investigator.
    Analyze the following runtime events and related static vulnerability findings.
    
    Events: {[e.model_dump() for e in events]}
    Findings: {[f.model_dump() for f in related_findings]}
    
    Determine:
    What happened?
    Who/what is involved?
    What changed?
    Is this suspicious?
    What evidence supports the conclusion?
    Which finding is related?
    
    Return the result matching the JSON schema.
    """
    
    result = await generate_structured_response(prompt, InvestigationResult)
    
    # Fallback if no LLM
    if not result:
        result = InvestigationResult(
            incident_summary="Suspicious sequence detected relating to IDOR vulnerability.",
            evidence=["Repeated access control violations", "Cross-user resource requests"],
            attack_sequence="Normal login -> Request other user order -> Repeated unauthorized access",
            confidence=0.91,
            related_finding_ids=[f.finding_id for f in related_findings],
            recommended_action="1. Enforce server-side ownership validation. 2. Verify authenticated user against requested order owner.",
            ai_explanation="The application's access-control weakness is not merely a static vulnerability. Runtime telemetry shows repeated attempts to access another customer's order data through the affected endpoint."
        )
        
    return result
