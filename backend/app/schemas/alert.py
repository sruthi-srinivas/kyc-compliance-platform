from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AlertUpdate(BaseModel):
    status: str  # OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED

class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    alert_type: str
    severity: str
    status: str
    description: str
    related_entity_type: str
    related_entity_id: str
    created_at: datetime
