from datetime import datetime, timezone
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(32), primary_key=True, index=True)  # Format: DOC-CUS-000001-001
    customer_id = Column(String(32), ForeignKey("customers.id"), nullable=False, index=True)
    document_type = Column(String(64), nullable=False, index=True)
    document_number = Column(String(128), nullable=False, index=True)
    issuing_country = Column(String(3), nullable=False, index=True)
    issuing_authority = Column(String(128), nullable=True)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True, index=True)
    lifecycle_state = Column(String(32), nullable=False, default="VALID", index=True)  # VALID, EXPIRED, SUPERSEDED, REVOKED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="documents")
    verifications = relationship("Verification", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document(id='{self.id}', customer='{self.customer_id}', type='{self.document_type}', state='{self.lifecycle_state}')>"
