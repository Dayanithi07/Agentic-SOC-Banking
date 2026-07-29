from fastapi import APIRouter
from pydantic import BaseModel
from app.telemetry.scheduler import scheduler, ReplayState
from app.telemetry.live_engine import live_loop

router = APIRouter(prefix="/api/replay", tags=["Replay"])

class SpeedRequest(BaseModel):
    speed: int

@router.get("/status", response_model=ReplayState)
async def get_status():
    return scheduler.state

@router.post("/start")
async def start_replay():
    scheduler.start(live_loop)
    return {"status": "started"}

@router.post("/pause")
async def pause_replay():
    scheduler.pause()
    return {"status": "paused"}

@router.post("/stop")
async def stop_replay():
    scheduler.stop()
    return {"status": "stopped"}

@router.post("/restart")
async def restart_replay():
    scheduler.restart(live_loop)
    return {"status": "restarted"}

@router.post("/speed")
async def set_speed(req: SpeedRequest):
    scheduler.set_speed(req.speed)
    return {"status": "speed_updated", "speed": req.speed}
