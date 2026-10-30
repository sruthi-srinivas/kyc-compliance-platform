from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(32), primary_key=True, index=True)  # Format: ALT-2026-000001
    customer_id = Column(String(32), ForeignKey("customers.id"), nullable=False, index=True)
    alert_type = Column(String(64), nullable=False, index=True)
    severity = Column(String(16), nullable=False, default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), nullable=False, default="OPEN", index=True)  # OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED
    description = Column(Text, nullable=False)
    related_entity_type = Column(String(32), nullable=False, index=True)  # Document, Customer, BeneficialOwner, ReviewCase
    related_entity_id = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="alerts")

    def __repr__(self):
        return f"<Alert(id='{self.id}', customer='{self.customer_id}', type='{self.alert_type}', severity='{self.severity}')>"
