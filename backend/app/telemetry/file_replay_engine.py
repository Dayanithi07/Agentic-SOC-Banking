import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional
from app.telemetry.scheduler import scheduler
from app.services.event_store import store
from app.models.event import SecurityEvent
from app.api.websocket import broadcast_event
from app.agents.orchestrator import orchestrator
from app.telemetry.anomaly_detector import anomaly_detector

SCENARIOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/scenarios"))
active_scenario_file: Optional[str] = "ecommerce_security_scenarios.jsonl"


def list_scenarios() -> List[str]:
    """List available .jsonl scenario files in data/scenarios/."""
    if not os.path.exists(SCENARIOS_DIR):
        return []
    return [f for f in os.listdir(SCENARIOS_DIR) if f.endswith(".jsonl") or f.endswith(".json")]


def load_scenario_events(filename: str) -> List[SecurityEvent]:
    """Load and parse events from a JSONL scenario file chronologically."""
    filepath = os.path.join(SCENARIOS_DIR, filename)
    if not os.path.exists(filepath):
        return []

    events = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                kwargs = {
                    "timestamp": data.get("timestamp") or datetime.utcnow().isoformat() + "Z",
                    "source": data.get("source", "ecommerce_app"),
                    "event_type": data.get("event_type", "web_request"),
                    "user_id": data.get("user_id") or data.get("user"),
                    "role": data.get("role"),
                    "ip_address": data.get("ip_address") or data.get("ip"),
                    "endpoint": data.get("endpoint"),
                    "http_method": data.get("http_method", "GET"),
                    "severity": data.get("severity", "info"),
                    "mitre_tactic": data.get("mitre_tactic"),
                    "mitre_technique": data.get("mitre_technique"),
                    "metadata": data.get("metadata") or {}
                }
                if data.get("event_id") or data.get("id"):
                    kwargs["event_id"] = data.get("event_id") or data.get("id")

                evt = SecurityEvent(**kwargs)
                events.append(evt)
            except Exception as e:
                print(f"Error parsing log line: {e}")

    try:
        events.sort(key=lambda e: e.timestamp)
    except Exception:
        pass

    return events


async def file_replay_loop():
    """Replays events from active_scenario_file paced by timestamps or speed settings."""
    global active_scenario_file
    if not active_scenario_file:
        active_scenario_file = "ecommerce_security_scenarios.jsonl"

    events = load_scenario_events(active_scenario_file)
    if not events:
        print(f"No events found in scenario {active_scenario_file}")
        return

    scheduler.state.total_events = len(events)
    scheduler.state.current_index = 0

    for i in range(len(events)):
        await scheduler._pause_event.wait()

        current_evt = events[i]

        # 1. Store in database
        await store.add(current_evt)

        # 2. Run anomaly detection
        anomaly_result = anomaly_detector.ingest(current_evt)

        # 3. Trigger orchestrator (AI agents)
        await orchestrator.process_event(current_evt)

        # 4. Broadcast event via WebSocket
        event_data = current_evt.model_dump()
        if anomaly_result["has_anomaly"]:
            event_data["anomalies"] = anomaly_result["anomalies"]
        await broadcast_event(event_data)

        scheduler.state.current_index = i + 1

        # Calculate pacing delay
        if i < len(events) - 1:
            try:
                t1 = datetime.fromisoformat(events[i].timestamp.replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(events[i + 1].timestamp.replace("Z", "+00:00"))
                delta_sec = max(0.2, (t2 - t1).total_seconds())
            except Exception:
                delta_sec = 1.0

            actual_delay = delta_sec / max(1, scheduler.state.speed)
            await asyncio.sleep(actual_delay)

        if scheduler.state.status == "stopped" or scheduler._task is None:
            break

    scheduler.state.status = "stopped"
