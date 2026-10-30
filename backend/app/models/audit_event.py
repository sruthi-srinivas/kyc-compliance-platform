from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Index
from backend.app.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)  # Format: AUD-2026-000001
    related_entity_type = Column(String(32), nullable=False, index=True)  # Customer, Document, Verification, ReviewCase, Alert, RiskRating
    related_entity_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)  # CUSTOMER_CREATED, DOCUMENT_UPLOADED, etc.
    actor = Column(String(64), nullable=False, default="SYSTEM_AUTOMATION", index=True)
    previous_state = Column(Text, nullable=True)
    new_state = Column(Text, nullable=False)
    event_details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<AuditEvent(id='{self.id}', entity='{self.related_entity_type}:{self.related_entity_id}', event='{self.event_type}', actor='{self.actor}')>"
