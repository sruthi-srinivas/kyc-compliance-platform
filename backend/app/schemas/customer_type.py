from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CustomerTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    description: Optional[str] = None
    requires_ubo: bool
    created_at: datetime
