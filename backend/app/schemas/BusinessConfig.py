
from pydantic import BaseModel

class DeliveryConfigUpdate(BaseModel):
    has_delivery: bool
    delivery_price: float