import asyncio
import datetime
from app.telemetry.event_loader import load_events
from app.telemetry.scheduler import scheduler
from app.services.event_store import store
from app.models.event import SecurityEvent
from app.api.websocket import _connections
from app.agents.orchestrator import orchestrator
import json
import os

SCENARIO_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "scenarios", "ecommerce_security_scenarios.jsonl")

async def replay_loop():
    events = load_events(SCENARIO_PATH)
    scheduler.state.total_events = len(events)
    
    if not events:
        scheduler.stop()
        return

    while scheduler.state.current_index < len(events):
        await scheduler._pause_event.wait()
        
        current_event = events[scheduler.state.current_index]
        
        # Calculate delay
        if scheduler.state.current_index > 0:
            prev_event = events[scheduler.state.current_index - 1]
            t1 = datetime.datetime.fromisoformat(prev_event["timestamp"].replace("Z", "+00:00"))
            t2 = datetime.datetime.fromisoformat(current_event["timestamp"].replace("Z", "+00:00"))
            diff_seconds = (t2 - t1).total_seconds()
            
            if diff_seconds > 0:
                delay = diff_seconds / scheduler.state.speed
                await asyncio.sleep(delay)
                
        # Emit event
        sec_event = SecurityEvent(
            event_type=current_event.get("event_type", "unknown"),
            user_id=current_event.get("user_id"),
            ip_address=current_event.get("ip_address"),
            endpoint=current_event.get("endpoint"),
            severity=current_event.get("severity", "info"),
            metadata=current_event.get("metadata", {})
        )
        
        await store.add(sec_event)
        
        # Trigger orchestrator
        asyncio.create_task(orchestrator.process_event(sec_event))
        
        # Broadcast to websockets
        event_json = json.dumps(sec_event.model_dump())
        for ws in _connections:
            try:
                await ws.send_text(event_json)
            except Exception:
                pass
                
        scheduler.state.current_index += 1
        if scheduler.state.total_events > 0:
            scheduler.state.progress = int((scheduler.state.current_index / scheduler.state.total_events) * 100)
            
    scheduler.stop()
