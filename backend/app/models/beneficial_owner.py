from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class BeneficialOwner(Base):
    __tablename__ = "beneficial_owners"

    id = Column(String(64), primary_key=True, index=True)  # Format: OWN-CUS-000001-001
    business_customer_id = Column(String(32), ForeignKey("customers.id"), nullable=False, index=True)
    owner_name = Column(String(255), nullable=False, index=True)
    nationality = Column(String(3), nullable=False, index=True)
    ownership_percentage = Column(Float, nullable=False)  # 0.01 - 100.0
    is_controlling_person = Column(Boolean, default=False, nullable=False)
    id_document_number = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="beneficial_owners")

    def __repr__(self):
        return f"<BeneficialOwner(id='{self.id}', business='{self.business_customer_id}', name='{self.owner_name}', pct={self.ownership_percentage}%)>"
