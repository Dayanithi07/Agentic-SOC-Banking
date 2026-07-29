from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent

class NetworkAnalysisResult(BaseModel):
    is_suspicious: bool
    confidence: float
    detected_tactics: List[str]
    detected_techniques: List[str]
    reasoning: str

async def analyze_network_events(events: List[SecurityEvent]) -> Optional[NetworkAnalysisResult]:
    prompt = f"""
    You are an expert Network Security Agent.
    Analyze the following network flow events to detect lateral movement, C2 beaconing, DNS tunneling, or port scanning.
    
    Events: {[e.model_dump() for e in events]}
    
    Determine:
    Is this sequence suspicious?
    What is the confidence score (0.0 to 1.0)?
    Which MITRE ATT&CK tactics and techniques apply?
    Provide your reasoning.
    """
    
    result = await generate_structured_response(prompt, NetworkAnalysisResult)
    
    if not result:
        # Heuristic fallback
        lateral = len([e for e in events if e.event_type == "lateral_movement"])
        is_suspicious = lateral > 0
        
        result = NetworkAnalysisResult(
            is_suspicious=is_suspicious,
            confidence=0.9 if is_suspicious else 0.1,
            detected_tactics=["Lateral Movement"] if is_suspicious else [],
            detected_techniques=["T1021 - Remote Services"] if is_suspicious else [],
            reasoning=f"Detected potential lateral movement across {lateral} hops." if is_suspicious else "Normal network traffic."
        )
        
    return result
