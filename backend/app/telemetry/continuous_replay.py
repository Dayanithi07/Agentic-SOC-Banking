"""Continuous scenario replay — cycles through all JSONL files for real-time demo."""
import asyncio
import os
import shutil
from datetime import datetime

from app.telemetry.scheduler import scheduler
from app.telemetry.file_replay_engine import (
    SCENARIOS_DIR,
    load_scenario_events,
    list_scenarios,
)
from app.telemetry.processor import process_telemetry_event

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../DATA"))


def sync_scenario_files() -> list[str]:
    """Copy JSONL files from DATA/ into backend/data/scenarios/."""
    os.makedirs(SCENARIOS_DIR, exist_ok=True)
    if os.path.isdir(DATA_DIR):
        for fname in os.listdir(DATA_DIR):
            if fname.endswith((".jsonl", ".json")):
                src = os.path.join(DATA_DIR, fname)
                dest = os.path.join(SCENARIOS_DIR, fname)
                if not os.path.exists(dest) or os.path.getmtime(src) > os.path.getmtime(dest):
                    shutil.copy2(src, dest)
    return list_scenarios()


async def continuous_replay_loop():
    """Replay all scenario files in rotation for continuous real-time monitoring."""
    scenarios = sync_scenario_files()
    if not scenarios:
        print("[continuous_replay] No scenario files found")
        return

    scheduler.state.total_events = 999999

    while True:
        await scheduler._pause_event.wait()

        for scenario in scenarios:
            events = load_scenario_events(scenario)
            if not events:
                continue

            for i, evt in enumerate(events):
                await scheduler._pause_event.wait()

                if scheduler.state.status == "stopped" or scheduler._task is None:
                    return

                await process_telemetry_event(evt)
                scheduler.state.current_index += 1

                if i < len(events) - 1:
                    try:
                        t1 = datetime.fromisoformat(events[i].timestamp.replace("Z", "+00:00"))
                        t2 = datetime.fromisoformat(events[i + 1].timestamp.replace("Z", "+00:00"))
                        delta_sec = max(0.3, (t2 - t1).total_seconds())
                    except Exception:
                        delta_sec = 0.8
                    await asyncio.sleep(delta_sec / max(1, scheduler.state.speed))

            # Brief pause between scenarios
            await asyncio.sleep(2.0 / max(1, scheduler.state.speed))

        if scheduler.state.status == "stopped" or scheduler._task is None:
            break
