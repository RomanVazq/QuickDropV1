import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from jose import jwt
from supabase import create_client, Client

from app.database.session import get_db
from app.models import base
from app.api.auth import oauth2_scheme
from app.core.security import SECRET_KEY, ALGORITHM

router = APIRouter()

# --- CONFIGURACIÓN SUPABASE ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- SEGURIDAD ---
def get_current_tenant_id(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        return tenant_id
    except Exception:
        raise HTTPException(status_code=401, detail="No se pudo validar el token")

# --- ENDPOINTS PÚBLICOS ---

@router.get("/public/{slug}")
def get_public_business_data(
    slug: str, 
    skip: int = 0, 
    limit: int = 5, 
    search: Optional[str] = None, # Parámetro de búsqueda añadido
    db: Session = Depends(get_db)
):
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="El negocio no existe")

    # Base de la consulta de items
    query = db.query(base.Item).filter(
        base.Item.tenant_id == tenant.id,
        base.Item.is_active == True
    )

    # Lógica de Filtro de Búsqueda
    if search:
        query = query.filter(
            or_(
                base.Item.name.ilike(f"%{search}%"),
                base.Item.description.ilike(f"%{search}%")
            )
        )

    total_items = query.count()
    items = query.offset(skip).limit(limit).all()

    posts = db.query(base.Post)\
              .filter(base.Post.tenant_id == tenant.id)\
              .order_by(base.Post.created_at.desc())\
              .limit(10).all()

    return {
        "business": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "phone": tenant.phone,
            "primary_color": tenant.primary_color,
            "secundary_color": tenant.secundary_color,
            "logo_url": tenant.logo_url
        },
        "items": items,
        "total_items": total_items,
        "posts": posts
    }

@router.get("/public/availability/{slug}")
async def get_availability(slug: str, date: str, db: Session = Depends(get_db)):
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    try:
        search_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")

    orders = db.query(base.Order).filter(
        base.Order.tenant_id == tenant.id,
        base.Order.status != "cancelled",
        base.Order.appointment_datetime >= search_date,
        base.Order.appointment_datetime < search_date + timedelta(days=1)
    ).all()

    return {"busy_times": [order.appointment_datetime.strftime("%H:%M") for order in orders]}

# --- GESTIÓN PRIVADA (DUEÑO) ---

@router.get("/me")
def get_business_info(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_tenant_id)):
    tenant = db.query(base.Tenant).filter(base.Tenant.id == tenant_id).first()
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
    return {
        "name": tenant.name,
        "slug": tenant.slug,
        "wallet": {"balance": wallet.balance if wallet else 0},
        "primary_color": tenant.primary_color,
        "secundary_color": tenant.secundary_color,
        "logo_url": tenant.logo_url
    }

@router.get("/items")
async def get_items(skip: int = 0, limit: int = 5, db: Session = Depends(get_db), current_user = Depends(get_current_tenant_id)):
    query = db.query(base.Item).filter(base.Item.tenant_id == current_user)
    total = query.count()
    items = query.order_by(base.Item.updated_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": items, "skip": skip, "limit": limit}

@router.post("/items")
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    is_service: bool = Form(False),
    stock: float = Form(0.0),
    description: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    image_url = None
    if image:
        file_content = await image.read()
        file_ext = image.filename.split(".")[-1]
        file_path = f"{tenant_id}/{uuid.uuid4().hex[:8]}.{file_ext}"
        supabase.storage.from_("images").upload(path=file_path, file=file_content, file_options={"content-type": image.content_type})
        image_url = supabase.storage.from_("images").get_public_url(file_path)

    new_item = base.Item(
        name=name, price=price, is_service=is_service, tenant_id=tenant_id,
        image_url=image_url, stock=stock, description=description, created_at=datetime.utcnow()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/items/{item_id}")
async def update_product(
    item_id: str,
    name: str = Form(...),
    price: float = Form(...),
    is_service: bool = Form(False),
    stock: float = Form(0.0),
    description: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    item = db.query(base.Item).filter(base.Item.id == item_id, base.Item.tenant_id == tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if image:
        file_content = await image.read()
        file_path = f"{tenant_id}/{uuid.uuid4().hex[:8]}.{image.filename.split('.')[-1]}"
        supabase.storage.from_("images").upload(path=file_path, file=file_content, file_options={"content-type": image.content_type, "upsert": "true"})
        item.image_url = supabase.storage.from_("images").get_public_url(file_path)

    item.name, item.price, item.is_service, item.stock = name, price, is_service, stock
    item.description = description or ""
    item.updated_at = datetime.utcnow()
    db.commit()
    return item

@router.delete("/items/{item_id}")
def delete_product(item_id: str, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_tenant_id)):
    item = db.query(base.Item).filter(base.Item.id == item_id, base.Item.tenant_id == tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if item.image_url:
        try:
            path = item.image_url.split("/public/images/")[1]
            supabase.storage.from_("images").remove([path])
        except: pass

    db.delete(item)
    db.commit()
    return {"detail": "Producto eliminado"}

@router.patch("/config")
async def update_business_config(
    primary_color: str = Form("#ffffff"),
    secundary_color: str = Form("#000000"),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_tenant_id)
):
    biz = db.query(base.Tenant).filter(base.Tenant.id == current_user).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    if file:
        content = await file.read()
        path = f"logos/{biz.id}/{uuid.uuid4()}.{file.filename.split('.')[-1]}"
        supabase.storage.from_("images").upload(path=path, file=content, file_options={"content-type": file.content_type, "x-upsert": "true"})
        biz.logo_url = supabase.storage.from_("images").get_public_url(path)

    biz.primary_color, biz.secundary_color = primary_color, secundary_color
    db.commit()
    return {"status": "success", "logo_url": biz.logo_url, "primary_color": biz.primary_color}