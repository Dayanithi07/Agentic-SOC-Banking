from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import datetime
import asyncio
from app.services.event_store import store
from app.models.event import SecurityEvent
from app.agents.orchestrator import orchestrator
from app.api.websocket import broadcast_event
from app.telemetry.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/api", tags=["E-Commerce"])

async def _process_and_broadcast(event: SecurityEvent):
    await store.add(event)
    anomaly_detector.ingest(event)
    asyncio.create_task(orchestrator.process_event(event))
    await broadcast_event(event.model_dump())

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
