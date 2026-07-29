from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import generate_structured_response
from app.models.finding import Finding

class AssessmentResult(BaseModel):
    finding_summary: str
    severity: str
    confidence: float
    recommended_investigation: str

async def analyze_finding(finding: Finding) -> Optional[AssessmentResult]:
    prompt = f"""
    You are an expert Security Assessment Agent.
    Analyze the following static finding:
    {finding.model_dump()}
    
    Determine:
    Summary, severity, confidence, and what runtime telemetry to monitor to prove exploitation.
    """
    
    result = await generate_structured_response(prompt, AssessmentResult)
    
    if not result:
        result = AssessmentResult(
            finding_summary=f"Detected {finding.title} in {finding.affected_endpoint}",
            severity=finding.severity,
            confidence=0.9,
            recommended_investigation="Monitor for unauthorized resource access requests and 403 responses."
        )
        
    return result
