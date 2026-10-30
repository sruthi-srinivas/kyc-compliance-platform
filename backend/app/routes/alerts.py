"""Alerts and Expiry Monitoring REST API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Alert
from backend.app.schemas import AlertRead, AlertUpdate
from backend.app.services import ComplianceService, AuditService

router = APIRouter(prefix="/alerts", tags=["Alerts & Expiry Monitoring"])

@router.get("", response_model=List[AlertRead])
def get_alerts(
    customer_id: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if customer_id:
        query = query.filter(Alert.customer_id == customer_id)
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    return query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()

@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert_status(
    alert_id: str,
    payload: AlertUpdate,
    actor: str = Query("OPERATIONS_ANALYST"),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    prev_status = alert.status
    alert.status = payload.status
    db.commit()
    db.refresh(alert)

    AuditService.log_event(
        db=db,
        related_entity_type="Alert",
        related_entity_id=alert_id,
        event_type="ALERT_STATUS_UPDATED",
        actor=actor,
        previous_state=prev_status,
        new_state=payload.status,
        event_details=f"Alert status modified to {payload.status}"
    )

    return alert

@router.post("/scan-expirations")
def trigger_expiry_scan(db: Session = Depends(get_db)):
    """Scans all documents and creates expiry alerts."""
    created = ComplianceService.scan_and_generate_expiry_alerts(db)
    return {"message": f"Expiry scan complete. {created} new alerts raised."}
