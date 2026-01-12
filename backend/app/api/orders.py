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

    total_price = 0
    resumen_items = []
    order_id = str(uuid.uuid4())
    db_items = [] # Lista para los registros de la tabla OrderItem

    # 3. Procesar cada ítem del pedido
    for item_input in order_data.items:
        # Buscamos el producto base
        product = db.query(base.Item).filter(base.Item.id == item_input.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto {item_input.product_id} no existe")

        current_unit_price = product.price
        variant_name = None
        
        # --- LÓGICA DE VARIANTES (Talla, Color, Sabor, etc.) ---
        if item_input.variant_name:
            variant = db.query(base.ItemVariant).filter(
                base.ItemVariant.item_id == product.id,
                base.ItemVariant.name == item_input.variant_name
            ).first()
            
            if not variant:
                raise HTTPException(status_code=400, detail=f"Variante '{item_input.variant_name}' no disponible")
            
            # Descuento de stock en Variante
            if not product.is_service:
                if variant.stock < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente: {product.name} ({variant.name})")
                variant.stock -= item_input.quantity
            
            if not product.is_service:
                # El stock del producto padre también se descuenta
                if product.stock < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente para: {product.name} solo hay: {int(product.stock)}")
                product.stock -= item_input.quantity

            current_unit_price = variant.price
            variant_name = variant.name
        
        # --- LÓGICA DE PRODUCTO SIMPLE (Sin variante) ---
        else:
            if not product.is_service:
                if product.stock < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente: {product.name}")
                product.stock -= item_input.quantity

        # --- LÓGICA DE EXTRAS (Ingredientes adicionales, complementos) ---
        extras_price_sum = 0
        if item_input.extras_names:
            # Convertimos el string "Queso, Tocino" en lista ["Queso", "Tocino"]
            names_list = [n.strip() for n in item_input.extras_names.split(",")]
            extras_db = db.query(base.ItemExtra).filter(
                base.ItemExtra.item_id == product.id,
                base.ItemExtra.name.in_(names_list)
            ).all()
            
            for extra in extras_db:
                # Descuento de stock en cada Extra
                if not product.is_service:
                    # El extra se descuenta multiplicado por la cantidad de productos pedidos
                    if extra.stock < item_input.quantity:
                        raise HTTPException(status_code=400, detail=f"Stock insuficiente para el extra: {extra.name}")
                    extra.stock -= item_input.quantity
                
                extras_price_sum += extra.price

        # 4. Cálculo de totales por línea
        line_unit_total = current_unit_price + extras_price_sum
        line_total = line_unit_total * item_input.quantity
        total_price += line_total

        # Crear el objeto de OrderItem (detalle del pedido)
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

        # Preparar texto para el resumen de WhatsApp
        extras_str = f" (+{item_input.extras_names})" if item_input.extras_names else ""
        variant_str = f" [{variant_name}]" if variant_name else ""
        resumen_items.append(f"- {item_input.quantity}x {product.name}{variant_str}{extras_str}")

    # 5. Crear la Orden Principal
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
    
    # 6. Gestión de Wallet (Descontar 1 crédito por pedido)
    previous_bal = wallet.balance
    wallet.balance -= 1
    
    # Registrar la transacción en el historial
    history = base.WalletTransaction(
        tenant_id=tenant.id,
        amount=-1,
        previous_balance=int(previous_bal),
        new_balance=int(wallet.balance),
        reason=f"Pedido: {order_id[:6]} | Cliente: {order_data.customer_name}"
    )
    
    # Si el saldo llega a 0, desactivar el negocio
    if wallet.balance <= 0:
        tenant.is_active = False

    # 7. Persistencia en Base de Datos
    try:
        db.add(new_order)
        db.add(history)
        db.add_all(db_items)
        db.commit() # Aquí se guardan los cambios de stock, wallet y orden
    except Exception as e:
        db.rollback()
        print(f"Error Database: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar el pedido")

    # 8. Respuesta al Cliente
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