"""Audit Event History REST API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import AuditEvent
from backend.app.schemas import AuditEventRead

router = APIRouter(prefix="/audit-events", tags=["Audit Trail"])

@router.get("", response_model=List[AuditEventRead])
def get_audit_events(
    entity_type: Optional[str] = Query(None, description="Filter by related entity (Customer, Document, etc.)"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    event_type: Optional[str] = Query(None, description="Filter by event category"),
    actor: Optional[str] = Query(None, description="Filter by actor"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if entity_type:
        query = query.filter(AuditEvent.related_entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditEvent.related_entity_id == entity_id)
    if event_type:
        query = query.filter(AuditEvent.event_type == event_type)
    if actor:
        query = query.filter(AuditEvent.actor == actor)
    return query.order_by(AuditEvent.timestamp.desc()).offset(skip).limit(limit).all()
