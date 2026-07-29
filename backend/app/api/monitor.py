"""Continuous website monitoring — health checks and telemetry for registered sites."""
import asyncio
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.event import SecurityEvent
from app.telemetry.processor import process_telemetry_event

router = APIRouter(prefix="/api/monitor", tags=["Monitor"])

_monitored_sites: dict[str, dict] = {}
_monitor_task: Optional[asyncio.Task] = None
CHECK_INTERVAL_SEC = 15


class RegisterSiteRequest(BaseModel):
    url: str
    name: Optional[str] = None


@router.post("/register")
async def register_site(req: RegisterSiteRequest):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    site_id = url.replace("https://", "").replace("http://", "").replace("/", "_")[:64]
    _monitored_sites[site_id] = {
        "url": url,
        "name": req.name or url,
        "status": "monitoring",
        "last_check": None,
        "last_status_code": None,
        "checks": 0,
        "failures": 0,
    }
    _ensure_monitor_running()
    return {"site_id": site_id, "url": url, "status": "monitoring"}


@router.get("/sites")
async def list_sites():
    return list(_monitored_sites.values())


@router.delete("/sites/{site_id}")
async def unregister_site(site_id: str):
    if site_id in _monitored_sites:
        del _monitored_sites[site_id]
    return {"status": "removed"}


def _ensure_monitor_running():
    global _monitor_task
    if _monitor_task is None or _monitor_task.done():
        _monitor_task = asyncio.create_task(_monitor_loop())


async def _monitor_loop():
    """Continuously health-check registered websites and emit telemetry."""
    while _monitored_sites:
        for site_id, site in list(_monitored_sites.items()):
            url = site["url"]
            try:
                async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                    resp = await client.get(url)
                site["last_check"] = datetime.utcnow().isoformat() + "Z"
                site["last_status_code"] = resp.status_code
                site["checks"] += 1
                site["status"] = "online" if resp.status_code < 500 else "degraded"

                event = SecurityEvent(
                    event_type="website_health_check",
                    source="Website Monitor",
                    user_id="monitor-agent",
                    ip_address="127.0.0.1",
                    endpoint=url,
                    http_method="GET",
                    severity="info" if resp.status_code < 400 else "medium",
                    metadata={
                        "status_code": resp.status_code,
                        "response_time_ms": resp.elapsed.total_seconds() * 1000 if resp.elapsed else 0,
                        "site_name": site["name"],
                        "monitor_type": "continuous",
                    },
                )
                await process_telemetry_event(event)

            except Exception as ex:
                site["failures"] += 1
                site["status"] = "offline"
                site["last_check"] = datetime.utcnow().isoformat() + "Z"
                event = SecurityEvent(
                    event_type="website_unreachable",
                    source="Website Monitor",
                    user_id="monitor-agent",
                    endpoint=url,
                    severity="high",
                    mitre_tactic="Impact",
                    mitre_technique="T1499 - Endpoint Denial of Service",
                    metadata={"error": str(ex), "site_name": site["name"], "monitor_type": "continuous"},
                )
                await process_telemetry_event(event)

        await asyncio.sleep(CHECK_INTERVAL_SEC)

    global _monitor_task
    _monitor_task = None
