from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class KYCRequirement(Base):
    __tablename__ = "kyc_requirements"

    id = Column(String(32), primary_key=True, index=True)  # Format: KYC-2026-000001
    customer_type_code = Column(String(32), ForeignKey("customer_types.code"), nullable=False, index=True)
    risk_level = Column(String(16), nullable=False, default="ALL", index=True)  # ALL, LOW, MEDIUM, HIGH
    document_type = Column(String(64), nullable=False, index=True)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    validity_period_days = Column(Integer, nullable=False, default=365)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer_type = relationship("CustomerType", back_populates="requirements")

    def __repr__(self):
        return f"<KYCRequirement(id='{self.id}', type='{self.customer_type_code}', risk='{self.risk_level}', doc='{self.document_type}')>"
