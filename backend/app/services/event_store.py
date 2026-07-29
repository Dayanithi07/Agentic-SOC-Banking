from sqlalchemy import select, func
from datetime import datetime, timedelta
from app.database.connection import async_session_maker
from app.database.models import SecurityEventDB
from app.models.event import SecurityEvent

class EventStore:
    async def add(self, event: SecurityEvent) -> None:
        async with async_session_maker() as session:
            db_event = SecurityEventDB(
                event_id=event.event_id,
                timestamp=event.timestamp,
                source=event.source,
                application_id=event.application_id,
                event_type=event.event_type,
                user_id=event.user_id,
                role=event.role,
                ip_address=event.ip_address,
                endpoint=event.endpoint,
                http_method=event.http_method,
                resource=event.resource,
                status=event.status,
                severity=event.severity,
                correlation_id=event.correlation_id,
                metadata_=event.metadata
            )
            session.add(db_event)
            await session.commit()

    async def add_many(self, events: list[SecurityEvent]) -> None:
        async with async_session_maker() as session:
            db_events = [
                SecurityEventDB(
                    event_id=e.event_id,
                    timestamp=e.timestamp,
                    source=e.source,
                    application_id=e.application_id,
                    event_type=e.event_type,
                    user_id=e.user_id,
                    role=e.role,
                    ip_address=e.ip_address,
                    endpoint=e.endpoint,
                    http_method=e.http_method,
                    resource=e.resource,
                    status=e.status,
                    severity=e.severity,
                    correlation_id=e.correlation_id,
                    metadata_=e.metadata
                ) for e in events
            ]
            session.add_all(db_events)
            await session.commit()

    async def get_all(self, limit: int = 100) -> list[SecurityEvent]:
        async with async_session_maker() as session:
            result = await session.execute(
                select(SecurityEventDB).order_by(SecurityEventDB.timestamp.desc()).limit(limit)
            )
            db_events = result.scalars().all()
            return [
                SecurityEvent(
                    event_id=e.event_id,
                    timestamp=e.timestamp,
                    source=e.source,
                    application_id=e.application_id,
                    event_type=e.event_type,
                    user_id=e.user_id,
                    role=e.role,
                    ip_address=e.ip_address,
                    endpoint=e.endpoint,
                    http_method=e.http_method,
                    resource=e.resource,
                    status=e.status,
                    severity=e.severity,
                    correlation_id=e.correlation_id,
                    metadata=e.metadata_ or {}
                ) for e in db_events
            ]

    async def get_by_severity(self, severity: str, limit: int = 50) -> list[SecurityEvent]:
        async with async_session_maker() as session:
            result = await session.execute(
                select(SecurityEventDB).filter(SecurityEventDB.severity == severity).order_by(SecurityEventDB.timestamp.desc()).limit(limit)
            )
            db_events = result.scalars().all()
            return [
                SecurityEvent(
                    event_id=e.event_id,
                    timestamp=e.timestamp,
                    source=e.source,
                    application_id=e.application_id,
                    event_type=e.event_type,
                    user_id=e.user_id,
                    role=e.role,
                    ip_address=e.ip_address,
                    endpoint=e.endpoint,
                    http_method=e.http_method,
                    resource=e.resource,
                    status=e.status,
                    severity=e.severity,
                    correlation_id=e.correlation_id,
                    metadata=e.metadata_ or {}
                ) for e in db_events
            ]

    async def stats(self) -> dict:
        async with async_session_maker() as session:
            total_result = await session.execute(select(func.count(SecurityEventDB.event_id)))
            total = total_result.scalar() or 0
            
            crit_result = await session.execute(
                select(func.count(SecurityEventDB.event_id)).filter(SecurityEventDB.severity == 'critical')
            )
            crit = crit_result.scalar() or 0
            
            # Since timestamp is string, we'll do an approximation for last hour or just return 0 for now.
            
            return {
                "total_events": total,
                "critical_alerts": crit,
                "active_agents": 3,  # Assessment, Investigation, Coordinator
                "threats_resolved": 0,
                "avg_risk_score": 0,  # Will compute later or fetch from Findings
                "events_last_hour": 0,
            }

# Singleton
store = EventStore()
