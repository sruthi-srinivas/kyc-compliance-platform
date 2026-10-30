from datetime import datetime
from pydantic import BaseModel, ConfigDict

class KYCRequirementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_type_code: str
    risk_level: str
    document_type: str
    is_mandatory: bool
    validity_period_days: int
    created_at: datetime
