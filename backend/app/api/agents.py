from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.correlation_engine import engine

router = APIRouter()

class TelemetryPayload(BaseModel):
    source: str
    message: str

class ActionPayload(BaseModel):
    action_id: str

class ScenarioPayload(BaseModel):
    scenario: str

@router.get("/telemetry", tags=["Telemetry"])
async def get_telemetry() -> List[Dict[str, Any]]:
    return engine.list_logs()

@router.post("/telemetry", tags=["Telemetry"])
async def ingest_telemetry(payload: TelemetryPayload) -> Dict[str, Any]:
    if payload.source not in ["iam", "edr", "database", "network", "policy"]:
        raise HTTPException(status_code=400, detail="Invalid telemetry source")
    log_entry = engine.add_log(payload.source, payload.message)
    return {"status": "success", "event": log_entry}

@router.get("/incidents", tags=["Incidents"])
async def get_incidents() -> List[Dict[str, Any]]:
    return engine.list_incidents()

@router.post("/incidents/{incident_id}/action", tags=["Incidents"])
async def run_incident_action(incident_id: str, payload: ActionPayload) -> Dict[str, Any]:
    success = engine.mitigate_incident_action(incident_id, payload.action_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident or Action not found")
    return {"status": "success", "mitigated": True}

@router.get("/agents/status", tags=["Agents"])
async def get_agents_status() -> List[Dict[str, Any]]:
    return engine.list_agents()

@router.post("/simulator/scenario", tags=["Simulator"])
async def run_simulation_scenario(payload: ScenarioPayload) -> Dict[str, Any]:
    if payload.scenario not in ["insider_exfil", "ransomware"]:
        raise HTTPException(status_code=400, detail="Unknown scenario profile")
    
    injected_count = engine.inject_scenario(payload.scenario)
    return {
        "status": "success", 
        "scenario": payload.scenario, 
        "events_injected": injected_count
    }
