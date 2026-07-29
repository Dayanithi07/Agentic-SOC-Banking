from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.telemetry.scheduler import scheduler, ReplayState
from app.telemetry.live_engine import live_loop
from app.telemetry.file_replay_engine import (
    list_scenarios,
    file_replay_loop,
)
import app.telemetry.file_replay_engine as file_engine

router = APIRouter(prefix="/api/replay", tags=["Replay"])

class SpeedRequest(BaseModel):
    speed: int

class SelectScenarioRequest(BaseModel):
    filename: str

@router.get("/status", response_model=ReplayState)
async def get_status():
    return scheduler.state

@router.get("/scenarios")
async def get_scenarios():
    """List available .jsonl scenario files in backend/data/scenarios/."""
    files = list_scenarios()
    return {
        "scenarios": files,
        "active_scenario": file_engine.active_scenario_file
    }

@router.post("/select-scenario")
async def select_scenario(req: SelectScenarioRequest):
    """Set active scenario file for replay."""
    file_engine.active_scenario_file = req.filename
    return {
        "status": "scenario_selected",
        "active_scenario": req.filename
    }

@router.post("/start")
async def start_replay(mode: Optional[str] = "file"):
    """Start replay mode='file' for JSONL scenario, mode='live' for random stream."""
    if mode == "live":
        scheduler.start(live_loop)
    else:
        scheduler.start(file_replay_loop)
    return {"status": "started", "mode": mode, "active_scenario": file_engine.active_scenario_file}

@router.post("/pause")
async def pause_replay():
    scheduler.pause()
    return {"status": "paused"}

@router.post("/stop")
async def stop_replay():
    scheduler.stop()
    return {"status": "stopped"}

@router.post("/restart")
async def restart_replay(mode: Optional[str] = "file"):
    scheduler.stop()
    if mode == "live":
        scheduler.start(live_loop)
    else:
        scheduler.start(file_replay_loop)
    return {"status": "restarted", "mode": mode}

@router.post("/speed")
async def set_speed(req: SpeedRequest):
    scheduler.set_speed(req.speed)
    return {"status": "speed_updated", "speed": req.speed}
