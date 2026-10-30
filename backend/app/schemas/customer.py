from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class CustomerBase(BaseModel):
    customer_type_code: str
    full_name: str
    registration_number: Optional[str] = None
    jurisdiction: str
    industry_sector: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    onboarding_status: Optional[str] = None
    current_risk_level: Optional[str] = None
    jurisdiction: Optional[str] = None
    industry_sector: Optional[str] = None

class CustomerRead(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    onboarding_status: str
    kyc_completeness: float
    current_risk_level: str
    created_at: datetime
    updated_at: datetime
