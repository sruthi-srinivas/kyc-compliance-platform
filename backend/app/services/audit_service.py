"""Audit logging service for maintaining an immutable, tamper-evident event trail."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.audit_event import AuditEvent

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        related_entity_type: str,
        related_entity_id: str,
        event_type: str,
        actor: str,
        new_state: str,
        previous_state: Optional[str] = None,
        event_details: Optional[str] = None
    ) -> AuditEvent:
        """Appends an immutable audit event to the audit trail."""
        # Query next sequential audit event count
        count = db.query(AuditEvent).count() + 1
        event_id = f"AUD-2026-{count:06d}"

        event = AuditEvent(
            id=event_id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            event_type=event_type,
            actor=actor,
            previous_state=str(previous_state) if previous_state is not None else None,
            new_state=str(new_state),
            event_details=event_details,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
