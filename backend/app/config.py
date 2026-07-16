import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
FRONTEND_ORIGIN    = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
RISK_THRESHOLD     = int(os.getenv("RISK_THRESHOLD", "70"))
