from pydantic import BaseModel, Field
from typing import Optional, List

# --- OPCIONES (VARIANTES Y EXTRAS) ---

class VariantBase(BaseModel):
    name: str # Ej: "Grande", "Rojo"
    price: int = Field(..., ge=0)

class VariantResponse(VariantBase):
    id: str
    class Config:
        from_attributes = True

class ExtraBase(BaseModel):
    name: str # Ej: "Queso Extra", "Envase de regalo"
    price: int = Field(..., ge=0)

class ExtraResponse(ExtraBase):
    id: str
    class Config:
        from_attributes = True

# --- ITEM (PRODUCTO/SERVICIO) ---

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int = Field(..., ge=0)
    is_service: bool = False
    image_url: Optional[str] = None
    stock: int = Field(default=0)

class ItemCreate(ItemBase):
    # Opcionalmente puedes permitir crear variantes al mismo tiempo
    variants: Optional[List[VariantBase]] = []
    extras: Optional[List[ExtraBase]] = []

class ItemResponse(ItemBase):
    id: str
    tenant_id: str
    # Incluimos las listas para que el PublicCatalog las vea
    variants: List[VariantResponse] = []
    extras: List[ExtraResponse] = []
    
    class Config:
        from_attributes = True