from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(32), primary_key=True, index=True)  # Format: CUS-000001
    customer_type_code = Column(String(32), ForeignKey("customer_types.code"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    registration_number = Column(String(64), nullable=True, index=True)
    jurisdiction = Column(String(3), nullable=False, index=True)
    industry_sector = Column(String(64), nullable=True, index=True)
    onboarding_status = Column(String(32), nullable=False, default="PENDING", index=True)  # PENDING, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED
    kyc_completeness = Column(Float, nullable=False, default=0.0)  # 0.0 - 100.0
    current_risk_level = Column(String(16), nullable=False, default="LOW", index=True)  # LOW, MEDIUM, HIGH
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer_type = relationship("CustomerType", back_populates="customers")
    documents = relationship("Document", back_populates="customer", cascade="all, delete-orphan")
    risk_ratings = relationship("RiskRating", back_populates="customer", cascade="all, delete-orphan")
    review_cases = relationship("ReviewCase", back_populates="customer", cascade="all, delete-orphan")
    beneficial_owners = relationship("BeneficialOwner", back_populates="customer", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Customer(id='{self.id}', name='{self.full_name}', type='{self.customer_type_code}', status='{self.onboarding_status}')>"
