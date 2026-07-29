from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent

class EndpointAnalysisResult(BaseModel):
    is_suspicious: bool
    confidence: float
    detected_tactics: List[str]
    detected_techniques: List[str]
    reasoning: str

async def analyze_endpoint_events(events: List[SecurityEvent]) -> Optional[EndpointAnalysisResult]:
    prompt = f"""
    You are an expert Endpoint Detection and Response (EDR) Security Agent.
    Analyze the following endpoint telemetry to detect suspicious process execution, unauthorized file access, or malware indicators.
    
    Events: {[e.model_dump() for e in events]}
    
    Determine:
    Is this sequence suspicious?
    What is the confidence score (0.0 to 1.0)?
    Which MITRE ATT&CK tactics and techniques apply?
    Provide your reasoning.
    """
    
    result = await generate_structured_response(prompt, EndpointAnalysisResult)
    
    if not result:
        # Heuristic fallback
        critical_events = [e for e in events if e.severity in ["critical", "high"]]
        is_suspicious = len(critical_events) > 0
        result = EndpointAnalysisResult(
            is_suspicious=is_suspicious,
            confidence=0.9 if is_suspicious else 0.1,
            detected_tactics=["Execution", "Defense Evasion"] if is_suspicious else [],
            detected_techniques=["T1059 - Command and Scripting Interpreter"] if is_suspicious else [],
            reasoning="Suspicious endpoint activity detected based on high severity events." if is_suspicious else "Normal endpoint activity."
        )
        
    return result
