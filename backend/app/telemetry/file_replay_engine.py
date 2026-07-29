import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional
from app.telemetry.scheduler import scheduler
from app.models.event import SecurityEvent
from app.telemetry.processor import process_telemetry_event

SCENARIOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/scenarios"))
active_scenario_file: Optional[str] = "ecommerce_security_scenarios.jsonl"


def list_scenarios() -> List[str]:
    """List available .jsonl scenario files in data/scenarios/."""
    if not os.path.exists(SCENARIOS_DIR):
        return []
    return [f for f in os.listdir(SCENARIOS_DIR) if f.endswith(".jsonl") or f.endswith(".json")]


def _parse_dict_to_event(data: dict) -> Optional[SecurityEvent]:
    try:
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

        return SecurityEvent(**kwargs)
    except Exception as e:
        print(f"Error parsing log dict: {e}")
        return None

def load_scenario_events(filename: str) -> List[SecurityEvent]:
    """Load and parse events from a JSONL or JSON scenario file chronologically."""
    filepath = os.path.join(SCENARIOS_DIR, filename)
    if not os.path.exists(filepath):
        return []

    events = []
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    if not content:
        return []

    # First attempt parsing full content as JSON (array or dict wrapper)
    try:
        parsed_json = json.loads(content)
        if isinstance(parsed_json, list):
            for item in parsed_json:
                if isinstance(item, dict):
                    evt = _parse_dict_to_event(item)
                    if evt:
                        events.append(evt)
            if events:
                events.sort(key=lambda e: e.timestamp)
                return events
        elif isinstance(parsed_json, dict):
            raw_list = parsed_json.get("events") or parsed_json.get("data") or [parsed_json]
            for item in raw_list:
                if isinstance(item, dict):
                    evt = _parse_dict_to_event(item)
                    if evt:
                        events.append(evt)
            if events:
                events.sort(key=lambda e: e.timestamp)
                return events
    except Exception:
        pass

    # Fallback to line-by-line JSONL parsing
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            if isinstance(data, dict):
                evt = _parse_dict_to_event(data)
                if evt:
                    events.append(evt)
        except Exception as e:
            print(f"Error parsing line: {e}")

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

        await process_telemetry_event(current_evt)

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
