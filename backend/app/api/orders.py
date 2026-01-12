import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session, joinedload
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
    variant_name: Optional[str] = None
    extras_names: Optional[str] = None

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

    # 2. Verificar saldo en Wallet
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant.id).first()
    if not wallet or wallet.balance <= 0:
        raise HTTPException(status_code=403, detail="Sin saldo suficiente.")

    total_price = 0
    resumen_items = []
    order_id = str(uuid.uuid4())
    
    # Lista para guardar los registros de OrderItem antes del commit
    db_items = []

    for item_input in order_data.items:
        # Buscamos el producto base
        product = db.query(base.Item).filter(base.Item.id == item_input.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto {item_input.product_id} no existe")

        # --- Lógica de Precios con Variantes y Extras ---
        # 1. Precio Base o de Variante
        current_unit_price = product.price
        variant_name = None
        
        if item_input.variant_name:
            variant = db.query(base.ItemVariant).filter(
                base.ItemVariant.item_id == product.id,
                base.ItemVariant.name == item_input.variant_name
            ).first()
            if variant:
                current_unit_price = variant.price
                variant_name = variant.name

        # 2. Cálculo de Extras
        extras_price_sum = 0
        if item_input.extras_names:
            # Separamos los nombres enviados (ej: "Queso, Tocino") para validar precios
            names_list = [n.strip() for n in item_input.extras_names.split(",")]
            extras_db = db.query(base.ItemExtra).filter(
                base.ItemExtra.item_id == product.id,
                base.ItemExtra.name.in_(names_list)
            ).all()
            extras_price_sum = sum(e.price for e in extras_db)

        # 3. Totales de la línea
        line_unit_total = current_unit_price + extras_price_sum
        line_total = line_unit_total * item_input.quantity
        total_price += line_total

        # --- Lógica de Stock ---
        if not product.is_service:
            if product.stock < item_input.quantity:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
            product.stock -= item_input.quantity

        # 4. Crear registro de OrderItem
        db_items.append(base.OrderItem(
            order_id=order_id,
            item_id=product.id,
            item_name=product.name,
            variant_name=variant_name,
            extras_summary=item_input.extras_names,
            quantity=item_input.quantity,
            unit_price=current_unit_price,
            extras_total_price=extras_price_sum,
            total_line_price=line_total
        ))

        # Texto para WhatsApp
        extras_str = f" ({item_input.extras_names})" if item_input.extras_names else ""
        variant_str = f" [{variant_name}]" if variant_name else ""
        resumen_items.append(f"- {item_input.quantity}x {product.name}{variant_str}{extras_str}")

    # 5. Crear la Orden
    new_order = base.Order(
        id=order_id,
        tenant_id=tenant.id,
        customer_name=order_data.customer_name,
        address=order_data.address,
        appointment_datetime=order_data.appointment_datetime,
        notes=order_data.notes,
        total_amount=total_price,
        status="pending"
    )
    
    wallet.balance -= 1 # Descontar crédito

    history = base.WalletTransaction(
    tenant_id=tenant.id,
    amount=-1,
    previous_balance=int(wallet.balance + 1),
    new_balance=int(wallet.balance),
    reason=f"Pedido generado: {order_id[:6]} CLIENTE: {order_data.customer_name} NEGOCIO: {tenant.name}"
)
    db.add(history)


    if wallet.balance <= 0:
        tenant.is_active = False

    try:
        db.add(new_order)
        db.add_all(db_items) # Agregamos todos los items del pedido
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar pedido")

    # 6. Respuesta
    return {
        "order_id": order_id[:8].upper(),
        "total": total_price,
        "business_phone": "52" + tenant.phone if tenant.phone else "",
        "appointment": new_order.appointment_datetime.strftime("%d/%m/%Y %H:%M") if new_order.appointment_datetime else "A convenir",
        "resumen": "\n".join(resumen_items)
    }

@router.get("/my-orders")
async def get_my_orders(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Usamos joinedload para traer los productos asociados a cada orden de golpe
    query = db.query(base.Order)\
        .options(joinedload(base.Order.order_items))\
        .filter(base.Order.tenant_id == current_user.tenant_id)
    
    if status and status != "all":
        query = query.filter(base.Order.status == status)

    orders = query.all()

    # Prioridad de estados
    status_priority = {'pending': 0, 'completed': 1, 'cancelled': 2}

    sorted_orders = sorted(
        orders, 
        key=lambda x: (
            status_priority.get(x.status, 99),
            -(x.created_at.timestamp() if x.created_at else 0)
        )
    )
    
    return sorted_orders

@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str = Body(..., embed=True),
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