from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import datetime
import asyncio
from app.models.event import SecurityEvent
from app.telemetry.processor import process_telemetry_event

router = APIRouter(prefix="/api", tags=["E-Commerce"])

async def _process_and_broadcast(event: SecurityEvent):
    await process_telemetry_event(event)

# Mock DB for e-commerce
users_db = {"john.smith": "password123", "admin": "admin_pass"}
orders_db = {"ORD-1": {"user": "john.smith", "item": "Laptop"}, "ORD-2": {"user": "admin", "item": "Server"}}

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if req.username in users_db and users_db[req.username] == req.password:
        event = SecurityEvent(
            event_type="login_success",
            user_id=req.username,
            ip_address=ip,
            endpoint="/api/auth/login",
            severity="info",
            status="resolved"
        )
        await _process_and_broadcast(event)
        return {"token": f"mock_token_{req.username}"}
    
    event = SecurityEvent(
        event_type="login_failure",
        user_id=req.username,
        ip_address=ip,
        endpoint="/api/auth/login",
        severity="medium",
        status="new",
        mitre_tactic="Credential Access",
        mitre_technique="T1110 - Brute Force"
    )
    await _process_and_broadcast(event)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request, authorization: Optional[str] = Header(None)):
    ip = request.client.host if request.client else "unknown"
    if not authorization:
        event = SecurityEvent(
            event_type="api_unauthorized",
            ip_address=ip,
            endpoint=f"/api/orders/{order_id}",
            severity="high",
            status="new",
            mitre_tactic="Initial Access",
            mitre_technique="T1190 - Exploit Public-Facing Application"
        )
        await _process_and_broadcast(event)
        raise HTTPException(status_code=401, detail="Missing auth token")
    
    # Very naive auth simulation
    user_id = authorization.replace("Bearer mock_token_", "").replace("mock_token_", "")
    
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = orders_db[order_id]
    
    # IDOR Vulnerability simulation
    if order["user"] != user_id:
        event = SecurityEvent(
            event_type="access_control_violation",
            user_id=user_id,
            ip_address=ip,
            endpoint=f"/api/orders/{order_id}",
            severity="critical",
            status="new",
            mitre_tactic="Privilege Escalation",
            mitre_technique="T1548 - Abuse Elevation Control Mechanism",
            metadata={"attempted_access": order["user"]}
        )
        await _process_and_broadcast(event)
        raise HTTPException(status_code=403, detail="Forbidden")

    return order

@router.get("/products")
async def get_products(request: Request):
    return [{"id": "PROD-1", "name": "Laptop", "price": 999.99}]

@router.post("/checkout")
async def checkout(request: Request, authorization: Optional[str] = Header(None)):
    ip = request.client.host if request.client else "unknown"
    if not authorization:
        raise HTTPException(status_code=401)
    
    user_id = authorization.replace("mock_token_", "")
    event = SecurityEvent(
        event_type="checkout_success",
        user_id=user_id,
        ip_address=ip,
        endpoint="/api/checkout",
        severity="info"
    )
    await _process_and_broadcast(event)
    return {"status": "success", "order_id": "ORD-NEW"}

class IngestEventRequest(BaseModel):
    event_type: str = "web_request"
    user_id: Optional[str] = "external_user"
    ip_address: Optional[str] = None
    endpoint: Optional[str] = "/live-website"
    http_method: Optional[str] = "GET"
    severity: Optional[str] = "info"
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    metadata: Optional[dict] = {}

@router.post("/telemetry/ingest")
async def ingest_live_telemetry(req: IngestEventRequest, request: Request):
    """Universal ingestion endpoint for external websites."""
    ip = req.ip_address or (request.client.host if request.client else "external_ip")
    event = SecurityEvent(
        event_type=req.event_type,
        user_id=req.user_id,
        ip_address=ip,
        endpoint=req.endpoint,
        http_method=req.http_method,
        severity=req.severity or "info",
        mitre_tactic=req.mitre_tactic,
        mitre_technique=req.mitre_technique,
        metadata=req.metadata or {}
    )
    await _process_and_broadcast(event)
    return {"status": "ingested", "event_id": event.event_id}

@router.get("/sdk/soc-agent.js")
async def get_soc_sdk_script():
    """Returns 1-line JS SDK to auto-monitor any live website."""
    js_code = """
(function() {
    const SOC_ENDPOINT = 'http://localhost:8000/api/telemetry/ingest';
    console.log('[SOC Copilot] Live Website Security Telemetry Monitoring Active');
    
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        const method = args[1]?.method || 'GET';
        
        try {
            const response = await originalFetch.apply(this, args);
            if (!url.includes('/api/telemetry')) {
                let severity = 'info';
                let event_type = 'web_request';
                if (response.status === 401) { severity = 'medium'; event_type = 'login_failure'; }
                if (response.status === 403) { severity = 'critical'; event_type = 'access_control_violation'; }
                
                originalFetch(SOC_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: event_type,
                        endpoint: url,
                        http_method: method,
                        severity: severity,
                        metadata: { status_code: response.status, origin: window.location.href }
                    })
                }).catch(() => {});
            }
            return response;
        } catch (err) {
            throw err;
        }
    };
})();
"""
    from fastapi.responses import Response
    return Response(content=js_code, media_type="application/javascript")
