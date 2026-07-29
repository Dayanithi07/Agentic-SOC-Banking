import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.api import health, events, agents, chat, websocket, ecommerce, replay, assessment, incidents, analytics, timeline, monitor

from contextlib import asynccontextmanager
from app.database.connection import init_db
from app.telemetry.scheduler import scheduler
from app.telemetry.continuous_replay import continuous_replay_loop, sync_scenario_files

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    sync_scenario_files()
    if os.getenv("AUTO_START_REPLAY", "true").lower() == "true":
        scheduler.start(continuous_replay_loop)
    yield
    scheduler.stop()

app = FastAPI(
    title="Agentic SOC Copilot",
    version="1.0.0",
    description="AI-powered Security Operations Center for Banking — FinSpark'26",
    lifespan=lifespan,
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
app.include_router(ecommerce.router)
app.include_router(replay.router)
app.include_router(assessment.router)
app.include_router(incidents.router)
app.include_router(analytics.router)
app.include_router(timeline.router)
app.include_router(monitor.router)

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Agentic SOC Copilot",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }
