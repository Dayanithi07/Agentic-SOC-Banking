from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json

router = APIRouter()

_connections: list[WebSocket] = []


async def broadcast(message: dict):
    """Broadcast a structured message to all WebSocket clients."""
    text = json.dumps(message)
    disconnected = []
    for ws in _connections:
        try:
            await ws.send_text(text)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in _connections:
            _connections.remove(ws)


async def broadcast_event(event_data: dict):
    await broadcast({"type": "event", "data": event_data})


async def broadcast_incident(incident_data: dict):
    await broadcast({"type": "incident", "data": incident_data})


async def broadcast_agent_activity(agent_name: str, event_id: str, result: dict):
    await broadcast({
        "type": "agent_activity",
        "data": {
            "agent_name": agent_name,
            "trigger_event_id": event_id,
            "result_summary": str(result.get("is_suspicious", "N/A")) if isinstance(result, dict) else "completed",
        }
    })


async def broadcast_stats(stats: dict):
    await broadcast({"type": "stats_update", "data": stats})


@router.websocket("/ws/telemetry")
async def telemetry_stream(ws: WebSocket):
    """WebSocket endpoint — streams security events to the frontend."""
    await ws.accept()
    _connections.append(ws)
    try:
        # Keep the connection open
        while True:
            await asyncio.sleep(1)
    except (WebSocketDisconnect, Exception):
        if ws in _connections:
            _connections.remove(ws)
