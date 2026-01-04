import os
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import base
from app.api.auth import oauth2_scheme
from jose import jwt
from app.core.security import SECRET_KEY, ALGORITHM
from supabase import create_client, Client
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter()

# --- CONFIGURACIÓN SUPABASE ---
SUPABASE_URL = os.getenv("SUPABASE_URL") or "https://vetqpetunrnscqizstix.supabase.co/"
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or "sb_publishable_EO8bJaRdWDQoBlr1fpZ6Xg_l0CKiq67"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- DEPENDENCIA PARA RUTAS PRIVADAS ---
def get_current_tenant_id(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(status_code=401, detail="Token inválido: falta tenant_id")
        return tenant_id
    except Exception:
        raise HTTPException(status_code=401, detail="No se pudo validar el token")

# --- 1. ENDPOINT PÚBLICO (EL QUE SOLUCIONA EL 404) ---
@router.get("/public/{slug}")
def get_public_business_data(slug: str, db: Session = Depends(get_db)):
    """
    Busca un negocio y sus productos por el slug (URL). 
    No requiere autenticación.
    """
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="El negocio no existe")

    # Obtenemos los productos o servicios de este negocio
    items = db.query(base.Item).filter(base.Item.tenant_id == tenant.id).all()

    return {
        "business": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "phone": tenant.phone
        },
        "items": items
    }

# --- 2. INFORMACIÓN PRIVADA (PARA EL DUEÑO) ---
@router.get("/me")
def get_business_info(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_tenant_id)):
    tenant = db.query(base.Tenant).filter(base.Tenant.id == tenant_id).first()
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
    return {
        "name": tenant.name,
        "slug": tenant.slug,
        "wallet": {"balance": wallet.balance if wallet else 0}
    }

# --- 3. GESTIÓN DE PRODUCTOS (LISTAR) ---
@router.get("/items")
def get_my_items(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_tenant_id)):
    return db.query(base.Item).filter(base.Item.tenant_id == tenant_id).all()

# --- 4. CREAR PRODUCTO ---
@router.post("/items")
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    is_service: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    image_url = None
    if image:
        try:
            file_content = await image.read()
            file_ext = image.filename.split(".")[-1]
            file_path = f"{tenant_id}/{name.replace(' ', '_')}_{uuid.uuid4().hex[:5]}.{file_ext}"

            supabase.storage.from_("images").upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": image.content_type, "upsert": "true"}
            )
            image_url = supabase.storage.from_("images").get_public_url(file_path)
        except Exception as e:
            print(f"Error Supabase: {e}")

    new_item = base.Item(
        name=name, 
        price=price, 
        is_service=is_service, 
        tenant_id=tenant_id,
        image_url=image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

# --- 5. ACTUALIZAR PRODUCTO ---
@router.put("/items/{item_id}")
async def update_product(
    item_id: str,
    name: str = Form(...),
    price: float = Form(...),
    is_service: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    item = db.query(base.Item).filter(base.Item.id == item_id, base.Item.tenant_id == tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if image:
        file_content = await image.read()
        file_path = f"{tenant_id}/{name.replace(' ', '_')}.{image.filename.split('.')[-1]}"
        supabase.storage.from_("images").upload(path=file_path, file=file_content, file_options={"upsert": "true"})
        item.image_url = supabase.storage.from_("images").get_public_url(file_path)

    item.name = name
    item.price = price
    item.is_service = is_service
    db.commit()
    db.refresh(item)
    return item

# --- 6. ELIMINAR PRODUCTO ---
@router.delete("/items/{item_id}")
def delete_product(
    item_id: str, 
    db: Session = Depends(get_db), 
    tenant_id: str = Depends(get_current_tenant_id)
):
    item = db.query(base.Item).filter(base.Item.id == item_id, base.Item.tenant_id == tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if item.image_url:
        try:
            file_path = item.image_url.split("/public/images/")[1]
            supabase.storage.from_("images").remove([file_path])
        except: pass

    db.delete(item)
    db.commit()
    return {"detail": "Producto eliminado"}

@router.get("/public/availability/{slug}")
async def get_availability(slug: str, date: str, db: Session = Depends(get_db)):
    """
    date debe venir en formato YYYY-MM-DD
    """
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    # Parsear la fecha buscada
    try:
        search_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")

    # Buscar todas las órdenes de ese día que no estén canceladas
    orders = db.query(base.Order).filter(
        base.Order.tenant_id == tenant.id,
        base.Order.status != "cancelled",
        base.Order.appointment_datetime >= search_date,
        base.Order.appointment_datetime < search_date + timedelta(days=1)
    ).all()

    # Retornar solo las horas ocupadas (ej: ["14:00", "15:30"])
    busy_times = [order.appointment_datetime.strftime("%H:%M") for order in orders]
    
    return {"busy_times": busy_times}    