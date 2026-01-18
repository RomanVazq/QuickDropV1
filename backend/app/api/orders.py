import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, ConfigDict

from app.database.session import get_db
from app.models import base
from app.api.auth import get_current_user 
from app.core.websocket_manager import manager
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
    delivery_type: str = "pickup"
    
    model_config = ConfigDict(from_attributes=True)

OrderCreateSchema.model_rebuild()



@router.post("/public/place-order/{slug}")
async def place_order(slug: str, order_data: OrderCreateSchema, db: Session = Depends(get_db)):
    # 1. Validar existencia del negocio (Tenant)
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not tenant: 
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    # 2. Verificar Wallet y Saldo
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant.id).first()
    if not wallet or wallet.balance <= 0:
        raise HTTPException(status_code=403, detail="El negocio no tiene créditos disponibles para recibir pedidos.")

    total_items_price = 0
    resumen_items = []
    order_id = str(uuid.uuid4())
    db_items = [] 

    # 3. Procesar cada ítem del pedido
    for item_input in order_data.items:
        product = db.query(base.Item).filter(base.Item.id == item_input.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto {item_input.product_id} no existe")

        current_unit_price = product.price
        variant_name = None
        
        # --- LÓGICA DE VARIANTES ---
        if item_input.variant_name:
            variant = db.query(base.ItemVariant).filter(
                base.ItemVariant.item_id == product.id,
                base.ItemVariant.name == item_input.variant_name
            ).first()
            
            if not variant:
                raise HTTPException(status_code=400, detail=f"Variante '{item_input.variant_name}' no disponible")
            
            if not product.is_service:
                if variant.stock < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente: {product.name} ({variant.name})")
                variant.stock -= item_input.quantity
                if product.stock < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente: {product.name}")
                product.stock -= item_input.quantity

            current_unit_price = variant.price
            variant_name = variant.name
        
        else:
            if not product.is_service:
                if product.stock < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente: {product.name}")
                product.stock -= item_input.quantity

        # --- LÓGICA DE EXTRAS ---
        extras_price_sum = 0
        if item_input.extras_names:
            names_list = [n.strip() for n in item_input.extras_names.split(",")]
            extras_db = db.query(base.ItemExtra).filter(
                base.ItemExtra.item_id == product.id,
                base.ItemExtra.name.in_(names_list)
            ).all()
            
            for extra in extras_db:
                if not product.is_service:
                    if extra.stock < item_input.quantity:
                        raise HTTPException(status_code=400, detail=f"Stock insuficiente extra: {extra.name}")
                    extra.stock -= item_input.quantity
                extras_price_sum += extra.price

        # 4. Cálculo de totales por línea
        line_unit_total = current_unit_price + extras_price_sum
        line_total = line_unit_total * item_input.quantity
        total_items_price += line_total

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

        extras_str = f" (+{item_input.extras_names})" if item_input.extras_names else ""
        variant_str = f" [{variant_name}]" if variant_name else ""
        resumen_items.append(f"- {item_input.quantity}x {product.name}{variant_str}{extras_str}: ${line_total}")

    # --- 5. LÓGICA DE COSTO DE ENVÍO ---
    applied_delivery_cost = 0.0
    if order_data.delivery_type == "delivery":
        if not tenant.has_delivery:
            raise HTTPException(status_code=400, detail="Este negocio no cuenta con servicio a domicilio.")
        
        if not order_data.address or len(order_data.address) < 5:
            raise HTTPException(status_code=400, detail="La dirección es obligatoria para pedidos a domicilio.")
        
        applied_delivery_cost = tenant.delivery_price

    final_total_amount = total_items_price + applied_delivery_cost

    # 6. Crear la Orden Principal
    new_order = base.Order(
        id=order_id,
        tenant_id=tenant.id,
        customer_name=order_data.customer_name,
        address=order_data.address,
        appointment_datetime=order_data.appointment_datetime,
        notes=order_data.notes,
        total_amount=final_total_amount,
        delivery_type=order_data.delivery_type,
        delivery_cost=applied_delivery_cost,
        status="pending"
    )
    
    # 7. Gestión de Wallet
    previous_bal = wallet.balance
    wallet.balance -= 1
    
    history = base.WalletTransaction(
        tenant_id=tenant.id,
        amount=-1,
        previous_balance=int(previous_bal),
        new_balance=int(wallet.balance),
        reason=f"Pedido: {order_id[:6]} | Cliente: {order_data.customer_name}"
    )
    
    if wallet.balance <= 0:
        tenant.is_active = False

    # 8. Guardar en Base de Datos
    try:
        db.add(new_order)
        db.add(history)
        db.add_all(db_items)
        db.commit()
        db.refresh(new_order)
    except Exception as e:
        db.rollback()
        print(f"Error Database: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar el pedido")

    # 9. Notificación WebSocket
    try:
        await manager.broadcast_to_tenant(
            tenant_id=tenant.id,
            message={
                "event": "NEW_ORDER",
                "order_id": order_id[:8].upper(),
                "customer": order_data.customer_name,
                "total": final_total_amount,
                "delivery_type": order_data.delivery_type,
                "items_count": len(order_data.items),
                "wallet_balance": int(wallet.balance)
            }
        )
    except Exception: pass

    # 10. Preparar Resumen Final para WhatsApp
    entrega_str = "A domicilio" if order_data.delivery_type == "delivery" else "Recoger en local"
    if applied_delivery_cost > 0:
        resumen_items.append(f"\nSubtotal: ${total_items_price}")
        resumen_items.append(f"Envío: ${applied_delivery_cost}")
    
    resumen_items.append(f"\nTOTAL: ${final_total_amount}")
    resumen_items.append(f"Tipo de entrega: {entrega_str}")

    return {
        "order_id": order_id[:8].upper(),
        "total": final_total_amount,
        "business_phone": tenant.phone if tenant.phone else "",
        "resumen": "\n".join(resumen_items),
        "delivery_type": order_data.delivery_type
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