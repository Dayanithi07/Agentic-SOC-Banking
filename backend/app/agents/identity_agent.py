from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent

class IdentityAnalysisResult(BaseModel):
    is_suspicious: bool
    confidence: float
    detected_tactics: List[str]
    detected_techniques: List[str]
    reasoning: str

async def analyze_identity_events(events: List[SecurityEvent]) -> Optional[IdentityAnalysisResult]:
    prompt = f"""
    You are an expert Identity & Access Management (IAM) Security Agent.
    Analyze the following identity-related events to detect brute force, credential stuffing, impossible travel, or privilege escalation.
    
    Events: {[e.model_dump() for e in events]}
    
    Determine:
    Is this sequence suspicious?
    What is the confidence score (0.0 to 1.0)?
    Which MITRE ATT&CK tactics and techniques apply?
    Provide your reasoning.
    """
    
    result = await generate_structured_response(prompt, IdentityAnalysisResult)
    
    if not result:
        # Heuristic fallback
        failed_logins = len([e for e in events if e.event_type == "login_failure"])
        is_suspicious = failed_logins >= 3 or any(e.event_type == "privilege_escalation" for e in events)
        result = IdentityAnalysisResult(
            is_suspicious=is_suspicious,
            confidence=0.85 if is_suspicious else 0.1,
            detected_tactics=["Credential Access"] if is_suspicious else [],
            detected_techniques=["T1110 - Brute Force"] if failed_logins >= 3 else [],
            reasoning=f"Detected {failed_logins} failed logins and potential privilege escalation." if is_suspicious else "Normal identity activity."
        )
        
    return result
