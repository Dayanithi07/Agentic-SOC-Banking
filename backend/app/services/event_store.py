"""In-memory event store — drop-in replacement for a real DB during demo."""
from collections import deque
from app.models.event import TelemetryEvent, generate_events
import asyncio, time

_MAX = 500

class EventStore:
    def __init__(self):
        self._events: deque[TelemetryEvent] = deque(maxlen=_MAX)
        self._lock = asyncio.Lock()
        # Seed with 30 events
        for e in generate_events(30):
            self._events.appendleft(e)

    async def add(self, event: TelemetryEvent) -> None:
        async with self._lock:
            self._events.appendleft(event)

    async def add_many(self, events: list[TelemetryEvent]) -> None:
        async with self._lock:
            for e in reversed(events):
                self._events.appendleft(e)

    async def get_all(self, limit: int = 100) -> list[TelemetryEvent]:
        async with self._lock:
            return list(self._events)[:limit]

    async def get_by_severity(self, severity: str, limit: int = 50) -> list[TelemetryEvent]:
        async with self._lock:
            return [e for e in self._events if e.severity == severity][:limit]

    async def stats(self) -> dict:
        async with self._lock:
            evs = list(self._events)
        total = len(evs)
        crit  = sum(1 for e in evs if e.severity == "critical")
        avg_r = round(sum(e.risk_score for e in evs) / total) if total else 0
        now   = time.time()
        last_h = sum(1 for e in evs if (now - time.mktime(
            time.strptime(e.timestamp[:19], "%Y-%m-%dT%H:%M:%S")
        )) < 3600)
        return {
            "total_events":     total,
            "critical_alerts":  crit,
            "active_agents":    6,
            "threats_resolved": round(total * 0.35),
            "avg_risk_score":   avg_r,
            "events_last_hour": last_h,
        }


# Singleton
store = EventStore()
