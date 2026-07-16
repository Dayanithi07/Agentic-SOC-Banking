from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.event import make_event
import asyncio, json

router = APIRouter()

_connections: list[WebSocket] = []

@router.websocket("/ws/telemetry")
async def telemetry_stream(ws: WebSocket):
    """WebSocket endpoint — streams a new security event every 8 seconds."""
    await ws.accept()
    _connections.append(ws)
    try:
        while True:
            await asyncio.sleep(8)
            event = make_event()
            await ws.send_text(json.dumps(event.model_dump()))
    except (WebSocketDisconnect, Exception):
        _connections.remove(ws)
