"""Unified telemetry processing pipeline for all ingestion paths."""
from app.models.event import SecurityEvent
from app.services.event_store import store
from app.telemetry.anomaly_detector import anomaly_detector
from app.agents.orchestrator import orchestrator
from app.api.websocket import broadcast_event, broadcast_stats


async def process_telemetry_event(event: SecurityEvent) -> dict:
    """Store, detect anomalies, run AI agents, and broadcast via WebSocket."""
    await store.add(event)

    anomaly_result = anomaly_detector.ingest(event)
    await orchestrator.process_event(event)

    event_data = event.model_dump()
    if anomaly_result["has_anomaly"]:
        event_data["anomalies"] = anomaly_result["anomalies"]

    await broadcast_event(event_data)

    try:
        stats = await store.stats()
        await broadcast_stats(stats)
    except Exception:
        pass

    return event_data
