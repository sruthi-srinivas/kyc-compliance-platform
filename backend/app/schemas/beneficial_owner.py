from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class BeneficialOwnerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_customer_id: str
    owner_name: str
    nationality: str
    ownership_percentage: float
    is_controlling_person: bool
    id_document_number: Optional[str] = None
    created_at: datetime
