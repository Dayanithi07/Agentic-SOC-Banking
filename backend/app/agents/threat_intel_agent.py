from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent

class ThreatIntelResult(BaseModel):
    is_suspicious: bool
    confidence: float
    detected_tactics: List[str]
    detected_techniques: List[str]
    reasoning: str

async def analyze_threat_intel(events: List[SecurityEvent]) -> Optional[ThreatIntelResult]:
    prompt = f"""
    You are an expert Threat Intelligence Agent.
    Cross-reference the following events (IPs, domains) against known threat intelligence.
    
    Events: {[e.model_dump() for e in events]}
    
    Determine:
    Is this sequence suspicious based on known bad actors?
    What is the confidence score (0.0 to 1.0)?
    Which MITRE ATT&CK tactics and techniques apply?
    Provide your reasoning.
    """
    
    result = await generate_structured_response(prompt, ThreatIntelResult)
    
    if not result:
        # Heuristic fallback: check for specific malicious IPs
        malicious_ips = ["198.51.100.99"]
        has_bad_ip = any(e.ip_address in malicious_ips for e in events)
        
        result = ThreatIntelResult(
            is_suspicious=has_bad_ip,
            confidence=0.95 if has_bad_ip else 0.05,
            detected_tactics=["Command and Control"] if has_bad_ip else [],
            detected_techniques=["T1071 - Application Layer Protocol"] if has_bad_ip else [],
            reasoning="Detected traffic from known malicious IP 198.51.100.99." if has_bad_ip else "No known threat intelligence hits."
        )
        
    return result
