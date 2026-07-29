from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

router = APIRouter()

_connections: list[WebSocket] = []

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
