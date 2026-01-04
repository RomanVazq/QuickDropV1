import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.database.session import get_db
from app.models import base
from app.api.auth import get_current_user 

router = APIRouter()

# --- ESQUEMAS (Pydantic) ---

class OrderItemSchema(BaseModel):
    product_id: str
    quantity: int
    model_config = ConfigDict(from_attributes=True)

class OrderCreateSchema(BaseModel):
    customer_name: str
    # En una barbería, la dirección puede ser opcional
    address: Optional[str] = None
    # Campo vital para la reserva de la cita
    appointment_datetime: Optional[datetime] = None
    # Notas como "Corte tipo fade" o "Preguntar por promoción"
    notes: Optional[str] = None
    items: List[OrderItemSchema]
    
    model_config = ConfigDict(from_attributes=True)

OrderCreateSchema.model_rebuild()

# --- RUTAS (Endpoints) ---

@router.post("/public/place-order/{slug}")
async def place_order(slug: str, order_data: OrderCreateSchema, db: Session = Depends(get_db)):
    # 1. Validar existencia del negocio
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not tenant: 
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    # 2. Verificar saldo en Wallet (SaaS Monetization)
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant.id).first()
    if not wallet or wallet.balance <= 0:
        raise HTTPException(
            status_code=403, 
            detail="El negocio no puede recibir citas por falta de saldo."
        )

    # 3. Calcular Total y Generar Resumen
    total_price = 0
    resumen_items = []
    
    for item in order_data.items:
        product = db.query(base.Item).filter(
            base.Item.id == item.product_id, 
            base.Item.tenant_id == tenant.id
        ).first()
        
        if product:
            subtotal = product.price * item.quantity
            total_price += subtotal
            resumen_items.append(f"- {item.quantity}x {product.name} (${product.price:.2f})")
        else:
            raise HTTPException(status_code=400, detail="Uno de los servicios no es válido")

    # 4. Crear la Orden/Cita
    new_order = base.Order(
        id=str(uuid.uuid4()), 
        tenant_id=tenant.id,
        customer_name=order_data.customer_name,
        address=order_data.address,   
        appointment_datetime=order_data.appointment_datetime,
        notes=order_data.notes,
        total_amount=total_price,
        status="pending",
        created_at=datetime.utcnow()
    )
    
    # 5. Descontar 1 crédito al negocio por la gestión de la cita
    wallet.balance -= 1
    
    try:
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la reserva")

    # 6. Respuesta para confirmación (útil para enviar a WhatsApp)
    fecha_formateada = new_order.appointment_datetime.strftime("%d/%m/%Y %H:%M") if new_order.appointment_datetime else "A convenir"
    
    return {
        "order_id": str(new_order.id)[:8].upper(),
        "total": total_price,
        "business_phone": "52" + tenant.phone if tenant.phone else "52XXXXXXXXXX",
        "appointment": fecha_formateada,
        "resumen": "\n".join(resumen_items)
    }

@router.get("/my-orders")
async def get_my_orders(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Lista todas las citas del negocio logueado, ordenadas por fecha de cita
    """
    orders = db.query(base.Order).filter(
        base.Order.tenant_id == current_user.tenant_id
    ).order_by(base.Order.appointment_datetime.asc()).all()
    
    return orders

@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """
    Permite al barbero completar o cancelar una cita
    """
    order = db.query(base.Order).filter(
        base.Order.id == order_id, 
        base.Order.tenant_id == current_user.tenant_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    order.status = status
    db.commit()
    return {"message": f"Estado de la cita actualizado a {status}"}