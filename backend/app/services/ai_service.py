"""Gemini AI integration for SOC Copilot chat and event explanation."""
import os
from app.config import GEMINI_API_KEY

_client = None

def _get_client():
    global _client
    if _client is None and GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            _client = genai.GenerativeModel("gemini-1.5-flash")
        except Exception:
            _client = None
    return _client

SYSTEM_PROMPT = """You are an expert AI Security Operations Center (SOC) Analyst for a major Indian bank.
Your role: analyse security telemetry, detect threats, explain risks, and recommend actions.
Data sources: Azure AD, CrowdStrike, SentinelOne, Palo Alto NGFW, Cisco Duo, Okta.
Response style: concise, technical, action-oriented. Max 3 sentences unless deep analysis requested.
Current threat landscape: active brute force campaigns, MFA bypass attempts, lateral movement in banking segment."""

FALLBACK_RESPONSES = {
    "critical":    "Current critical alerts demand immediate action. Top threats: MFA bypass (Azure AD) and lateral movement (Palo Alto). Recommend: account lockout, subnet isolation, CISO escalation.",
    "risk":        "Avg risk score is elevated. Primary contributors: Lateral Movement (avg 91/100) and MFA Bypass (avg 87/100). Recommend activating Tier-2 incident response.",
    "agent":       "All 6 AI agents are active: IAM, EDR, Network, Firewall, PAM, Coordinator. Network Agent is busy analysing elevated east-west traffic. Zero system errors in last cycle.",
    "recommend":   "Top recommendations: 1) Enforce MFA on all admin accounts. 2) Block suspicious IPs at Palo Alto perimeter. 3) Rotate compromised svc-account credentials. 4) Enable anomaly alerts for high-value wire transfers.",
    "status":      "SOC operational. 6 agents active, 6 data sources streaming, 0 errors. Last detection cycle: 32 seconds ago. 3 open investigations. 2 critical incidents pending CISO review.",
    "lateral":     "Lateral movement detected on payment VLAN. Attacker traversed 14 hosts in 22 minutes using valid credentials. Recommend immediate network segmentation and endpoint quarantine.",
    "exfil":       "Data exfiltration risk: HIGH. 18 GB transferred to unknown S3 bucket via svc-account between 02:00-04:00 IST. Recommend immediate DLP enforcement and svc-account suspension.",
    "default":     "SOC Copilot monitoring 6 data sources in real time. I can assist with threat analysis, risk assessment, agent status, MITRE ATT&CK mapping, and remediation recommendations.",
}


async def chat(message: str, history: list[dict] | None = None) -> str:
    client = _get_client()
    if client:
        try:
            print("🤖 [AI Service] Routing query to real Google Gemini API...")
            prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}\nAssistant:"
            response = client.generate_content(prompt)
            print("🟢 [AI Service] Gemini response received successfully!")
            return response.text.strip()
        except Exception as e:
            print(f"❌ [AI Service] Gemini API call failed: {e}. Falling back to mock engine.")
            pass  # Fall through to mock

    # Smart fallback
    print("⚠️ [AI Service] No Gemini API key detected (or API failed). Using offline mock engine.")
    q = message.lower()
    for key in FALLBACK_RESPONSES:
        if key in q:
            return FALLBACK_RESPONSES[key]
    return FALLBACK_RESPONSES["default"]
