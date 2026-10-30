from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(64), primary_key=True, index=True)  # Format: VER-DOC-CUS-000001-001
    document_id = Column(String(32), ForeignKey("documents.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="PENDING_REVIEW", index=True)  # PENDING_REVIEW, VERIFIED, REJECTED
    verified_by_actor = Column(String(64), nullable=False, default="OPERATIONS_ANALYST")
    analyst_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="verifications")

    def __repr__(self):
        return f"<Verification(id='{self.id}', doc='{self.document_id}', status='{self.status}')>"
