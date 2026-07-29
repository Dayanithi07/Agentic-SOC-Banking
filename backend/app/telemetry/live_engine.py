import asyncio
import random
import json
from app.telemetry.scheduler import scheduler
from app.models.event import SecurityEvent, generate_events
from app.telemetry.processor import process_telemetry_event


class LiveDataGenerator:
    def __init__(self):
        self.buffer = []

    async def generate_next_event(self) -> SecurityEvent:
        if not self.buffer:
            self.buffer = generate_events(n=20)
        return self.buffer.pop(0)


async def live_loop():
    generator = LiveDataGenerator()
    scheduler.state.total_events = 99999

    while True:
        await scheduler._pause_event.wait()

        # Determine wait time based on speed
        base_delay = random.uniform(1.0, 3.0)
        actual_delay = base_delay / scheduler.state.speed
        await asyncio.sleep(actual_delay)

        sec_event = await generator.generate_next_event()

        await process_telemetry_event(sec_event)

        scheduler.state.current_index += 1

        if scheduler.state.status == "stopped" or scheduler._task is None:
            break
