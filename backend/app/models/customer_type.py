from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class CustomerType(Base):
    __tablename__ = "customer_types"

    code = Column(String(32), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    requires_ubo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customers = relationship("Customer", back_populates="customer_type")
    requirements = relationship("KYCRequirement", back_populates="customer_type", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CustomerType(code='{self.code}', name='{self.name}')>"
