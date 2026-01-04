from pydantic import BaseModel, Field
from typing import Optional

class ItemBase(BaseModel):
    name: str
    price: int = Field(..., ge=0)
    is_service: bool = False

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: str
    tenant_id: str
    class Config:
        from_attributes = True