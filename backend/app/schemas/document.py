from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DocumentBase(BaseModel):
    customer_id: str
    document_type: str
    document_number: str
    issuing_country: str
    issuing_authority: Optional[str] = None
    issue_date: date
    expiry_date: Optional[date] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lifecycle_state: str
    created_at: datetime
    updated_at: datetime
