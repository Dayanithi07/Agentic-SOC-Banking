from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent

class PolicyAnalysisResult(BaseModel):
    is_suspicious: bool
    confidence: float
    detected_tactics: List[str]
    detected_techniques: List[str]
    reasoning: str

async def analyze_policy_events(events: List[SecurityEvent]) -> Optional[PolicyAnalysisResult]:
    prompt = f"""
    You are an expert Security Policy Agent.
    Evaluate the following events against standard banking security policies and compliance rules.
    
    Events: {[e.model_dump() for e in events]}
    
    Determine:
    Are there any policy violations?
    What is the confidence score (0.0 to 1.0)?
    Which MITRE ATT&CK tactics and techniques apply?
    Provide your reasoning.
    """
    
    result = await generate_structured_response(prompt, PolicyAnalysisResult)
    
    if not result:
        # Heuristic fallback
        violations = [e for e in events if "violation" in e.event_type]
        is_suspicious = len(violations) > 0
        
        result = PolicyAnalysisResult(
            is_suspicious=is_suspicious,
            confidence=0.85 if is_suspicious else 0.1,
            detected_tactics=["Impact"] if is_suspicious else [],
            detected_techniques=["T1498 - Network Denial of Service"] if is_suspicious else [], # Example mapping
            reasoning=f"Detected {len(violations)} explicit policy violations." if is_suspicious else "Traffic complies with security policies."
        )
        
    return result
