from pydantic import BaseModel
from typing import List, Optional

class BusinessHourSchema(BaseModel):
    day_of_week: int
    open_time: str
    close_time: str
    is_closed: bool

class BusinessHoursList(BaseModel):
    hours: List[BusinessHourSchema]

class BusinessProfileUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    phone: Optional[str] = None
    appointment_interval: Optional[int] = None