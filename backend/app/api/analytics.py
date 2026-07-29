from fastapi import APIRouter
from app.database.connection import async_session_maker
from app.database.models import SecurityEventDB, IncidentDB, AgentRunDB, FindingDB
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
async def analytics_overview():
    """Dashboard KPI summary from real DB data."""
    async with async_session_maker() as session:
        # Total events
        total_events = (await session.execute(select(func.count(SecurityEventDB.event_id)))).scalar() or 0

        # Events by severity
        sev_rows = (await session.execute(
            select(SecurityEventDB.severity, func.count(SecurityEventDB.event_id))
            .group_by(SecurityEventDB.severity)
        )).all()
        severity_counts = {row[0]: row[1] for row in sev_rows}

        # Total incidents
        total_incidents = (await session.execute(select(func.count(IncidentDB.incident_id)))).scalar() or 0

        # Open incidents (not resolved/false_positive)
        open_incidents = (await session.execute(
            select(func.count(IncidentDB.incident_id))
            .where(IncidentDB.status.not_in(["resolved", "false_positive"]))
        )).scalar() or 0

        # Agent runs
        total_runs = (await session.execute(select(func.count(AgentRunDB.run_id)))).scalar() or 0

        # Average risk score
        avg_risk = (await session.execute(select(func.avg(IncidentDB.risk_score)))).scalar() or 0

        return {
            "total_events": total_events,
            "severity_counts": severity_counts,
            "total_incidents": total_incidents,
            "open_incidents": open_incidents,
            "total_agent_runs": total_runs,
            "avg_risk_score": round(float(avg_risk), 1),
        }


@router.get("/severity-trend")
async def severity_trend():
    """Severity counts grouped by hour (last 24 hours)."""
    async with async_session_maker() as session:
        result = (await session.execute(
            select(SecurityEventDB.severity, SecurityEventDB.timestamp)
            .order_by(SecurityEventDB.timestamp.desc())
            .limit(500)
        )).all()

    # Group into hourly buckets
    buckets = {}
    for severity, ts_str in result:
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            hour_key = ts.strftime("%Y-%m-%d %H:00")
        except Exception:
            hour_key = "unknown"
        if hour_key not in buckets:
            buckets[hour_key] = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        if severity in buckets[hour_key]:
            buckets[hour_key][severity] += 1

    # Convert to sorted list
    trend = [{"hour": k, **v} for k, v in sorted(buckets.items())]
    return trend[-24:] if len(trend) > 24 else trend


@router.get("/top-users")
async def top_users():
    """Most active / suspicious users."""
    async with async_session_maker() as session:
        rows = (await session.execute(
            select(SecurityEventDB.user_id, func.count(SecurityEventDB.event_id).label("count"))
            .where(SecurityEventDB.user_id.isnot(None))
            .group_by(SecurityEventDB.user_id)
            .order_by(desc("count"))
            .limit(10)
        )).all()
    return [{"user_id": r[0], "event_count": r[1]} for r in rows]


@router.get("/top-endpoints")
async def top_endpoints():
    """Most targeted endpoints."""
    async with async_session_maker() as session:
        rows = (await session.execute(
            select(SecurityEventDB.endpoint, func.count(SecurityEventDB.event_id).label("count"))
            .where(SecurityEventDB.endpoint.isnot(None))
            .group_by(SecurityEventDB.endpoint)
            .order_by(desc("count"))
            .limit(10)
        )).all()
    return [{"endpoint": r[0], "event_count": r[1]} for r in rows]


@router.get("/mitre-coverage")
async def mitre_coverage():
    """MITRE ATT&CK technique coverage heatmap data."""
    async with async_session_maker() as session:
        rows = (await session.execute(
            select(SecurityEventDB.mitre_tactic, SecurityEventDB.mitre_technique,
                   func.count(SecurityEventDB.event_id).label("count"))
            .where(SecurityEventDB.mitre_tactic.isnot(None))
            .group_by(SecurityEventDB.mitre_tactic, SecurityEventDB.mitre_technique)
            .order_by(desc("count"))
        )).all()
    return [{"tactic": r[0], "technique": r[1], "count": r[2]} for r in rows]


@router.get("/event-sources")
async def event_sources():
    """Event count by source."""
    async with async_session_maker() as session:
        rows = (await session.execute(
            select(SecurityEventDB.source, func.count(SecurityEventDB.event_id).label("count"))
            .group_by(SecurityEventDB.source)
            .order_by(desc("count"))
        )).all()
    return [{"source": r[0], "count": r[1]} for r in rows]
