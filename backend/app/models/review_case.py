from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Date, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ReviewCase(Base):
    __tablename__ = "review_cases"

    id = Column(String(64), primary_key=True, index=True)  # Format: REV-CUS-000001-2026
    customer_id = Column(String(32), ForeignKey("customers.id"), nullable=False, index=True)
    review_type = Column(String(32), nullable=False, default="PERIODIC", index=True)  # PERIODIC, TRIGGERED_EVENT, REMEDIATION
    status = Column(String(32), nullable=False, default="SCHEDULED", index=True)  # SCHEDULED, UNDER_REVIEW, RESOLVED, CLOSED
    assigned_reviewer = Column(String(64), nullable=True)
    scheduled_due_date = Column(Date, nullable=False, index=True)
    completed_date = Column(Date, nullable=True)
    is_overdue = Column(Boolean, default=False, nullable=False, index=True)
    resolution_decision = Column(String(64), nullable=True)  # MAINTAIN_RATING, UPGRADE_RISK, DOWNGRADE_RISK, OFFBOARD
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="review_cases")

    def __repr__(self):
        return f"<ReviewCase(id='{self.id}', customer='{self.customer_id}', status='{self.status}', overdue={self.is_overdue})>"
