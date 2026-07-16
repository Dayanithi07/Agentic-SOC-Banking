import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.agents import router as agents_router
from app.api.health import router as health_router

load_dotenv()

app = FastAPI(title="Agentic SOC Copilot Backend", version="0.1.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router, prefix="/api")
app.include_router(agents_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Agentic SOC Copilot API Gateway Running",
        "docs_url": "/docs"
    }
