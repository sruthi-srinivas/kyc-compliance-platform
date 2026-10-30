from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class RiskRatingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    risk_score: float
    risk_level: str
    review_interval_months: int
    assessed_by: str
    score_breakdown: Optional[str] = None
    effective_date: date
    is_current: bool
    created_at: datetime
