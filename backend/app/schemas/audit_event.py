from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    related_entity_type: str
    related_entity_id: str
    event_type: str
    actor: str
    previous_state: Optional[str] = None
    new_state: str
    event_details: Optional[str] = None
    timestamp: datetime
