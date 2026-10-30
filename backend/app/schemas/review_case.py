from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ReviewCaseUpdate(BaseModel):
    status: Optional[str] = None
    resolution_decision: Optional[str] = None
    resolution_notes: Optional[str] = None
    completed_date: Optional[date] = None

class ReviewCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    review_type: str
    status: str
    assigned_reviewer: Optional[str] = None
    scheduled_due_date: date
    completed_date: Optional[date] = None
    is_overdue: bool
    resolution_decision: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
