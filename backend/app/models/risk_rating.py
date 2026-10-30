from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, Date, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class RiskRating(Base):
    __tablename__ = "risk_ratings"

    id = Column(String(64), primary_key=True, index=True)  # Format: RSK-CUS-000001-2026
    customer_id = Column(String(32), ForeignKey("customers.id"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False, default=20.0)  # 0.0 - 100.0
    risk_level = Column(String(16), nullable=False, default="LOW", index=True)  # LOW, MEDIUM, HIGH
    review_interval_months = Column(Integer, nullable=False, default=36)
    assessed_by = Column(String(64), nullable=False, default="SYSTEM_ENGINE")
    score_breakdown = Column(Text, nullable=True)  # JSON formatted factor details
    effective_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="risk_ratings")

    def __repr__(self):
        return f"<RiskRating(id='{self.id}', customer='{self.customer_id}', score={self.risk_score}, level='{self.risk_level}', is_current={self.is_current})>"
