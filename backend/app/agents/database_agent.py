from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent

class DatabaseAnalysisResult(BaseModel):
    is_suspicious: bool
    confidence: float
    detected_tactics: List[str]
    detected_techniques: List[str]
    reasoning: str

async def analyze_database_events(events: List[SecurityEvent]) -> Optional[DatabaseAnalysisResult]:
    prompt = f"""
    You are an expert Database Security Agent.
    Analyze the following database audit events to detect bulk data export, SQL injection patterns, or unauthorized schema access.
    
    Events: {[e.model_dump() for e in events]}
    
    Determine:
    Is this sequence suspicious?
    What is the confidence score (0.0 to 1.0)?
    Which MITRE ATT&CK tactics and techniques apply?
    Provide your reasoning.
    """
    
    result = await generate_structured_response(prompt, DatabaseAnalysisResult)
    
    if not result:
        # Heuristic fallback
        sql_injections = len([e for e in events if e.event_type == "sql_injection_attempt"])
        data_exports = len([e for e in events if e.event_type == "data_export"])
        is_suspicious = sql_injections > 0 or data_exports > 0
        
        tactics = []
        techniques = []
        if sql_injections > 0:
            tactics.append("Initial Access")
            techniques.append("T1190 - Exploit Public-Facing Application")
        if data_exports > 0:
            tactics.append("Exfiltration")
            techniques.append("T1041 - Exfiltration Over C2 Channel")
            
        result = DatabaseAnalysisResult(
            is_suspicious=is_suspicious,
            confidence=0.95 if is_suspicious else 0.1,
            detected_tactics=tactics,
            detected_techniques=techniques,
            reasoning=f"Detected SQL injection ({sql_injections}) and/or data export ({data_exports}) activity." if is_suspicious else "Normal database activity."
        )
        
    return result
