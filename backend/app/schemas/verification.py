from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class VerificationUpdate(BaseModel):
    status: str  # PENDING_REVIEW, VERIFIED, REJECTED
    actor: str
    analyst_notes: Optional[str] = None

class VerificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    status: str
    verified_by_actor: str
    analyst_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
