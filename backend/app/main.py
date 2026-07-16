import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.api import health, events, agents, chat, websocket

app = FastAPI(
    title="Agentic SOC Copilot",
    version="1.0.0",
    description="AI-powered Security Operations Center for Banking — FinSpark'26",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(events.router)
app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(websocket.router)

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Agentic SOC Copilot",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }
