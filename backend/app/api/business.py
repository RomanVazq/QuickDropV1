import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
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
    search: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    
    # 1. Validamos existencia Y estado activo
    if not tenant or not getattr(tenant, 'is_active', True):
        raise HTTPException(
            status_code=404, 
            detail="El negocio no existe o no está disponible"
        )

    query = db.query(base.Item).filter(base.Item.tenant_id == tenant.id)

    if search:
        query = query.filter(
            or_(
                base.Item.name.ilike(f"%{search}%"),
                base.Item.description.ilike(f"%{search}%")
            )
        )

    total_items = query.count()
    # Usamos joinedload para evitar el problema de N+1 consultas en variantes y extras
    items = query.options(
        joinedload(base.Item.variants),
        joinedload(base.Item.extras)
    ).offset(skip).limit(limit).all()

    formatted_items = []
    for item in items:
        formatted_items.append({
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "description": item.description,
            "image_url": item.image_url,
            "is_service": item.is_service,
            "stock": item.stock,
            "variants": [{"id": v.id, "name": v.name, "price": v.price, "stock": v.stock} for v in item.variants],
            "extras": [{"id": e.id, "name": e.name, "price": e.price, "stock": e.stock} for e in item.extras]
        })

    posts = db.query(base.Post).filter(base.Post.tenant_id == tenant.id)\
              .order_by(base.Post.created_at.desc()).limit(10).all()

    return {
        "business": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "phone": tenant.phone,
            "primary_color": tenant.primary_color,
            "secundary_color": tenant.secundary_color,
            "logo_url": tenant.logo_url,
            "is_active": tenant.is_active # Lo enviamos por si el front lo necesita
        },
        "items": formatted_items,
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
async def get_items(
    skip: int = 0, 
    limit: int = 5, 
    q: str = None, # 1. Agregamos el parámetro opcional de búsqueda
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_tenant_id)
):
    # 2. Base de la consulta
    query = db.query(base.Item).options(
        joinedload(base.Item.variants),
        joinedload(base.Item.extras)
    ).filter(base.Item.tenant_id == current_user)
    
    # 3. Aplicamos el filtro de búsqueda si existe "q"
    if q:
        search_filter = f"%{q}%" # Formato para búsqueda parcial (LIKE)
        query = query.filter(
            or_(
                base.Item.name.ilike(search_filter),        # ilike no distingue entre Mayús/Minús
                base.Item.description.ilike(search_filter)
            )
        )
    
    # 4. Contamos el total (después de filtrar)
    total = query.count()
    
    # 5. Ejecutamos la consulta con orden y paginación
    items = query.order_by(base.Item.updated_at.desc()).offset(skip).limit(limit).all()
    
    # 6. Retornamos la respuesta
    return {
        "total": total, 
        "items": items, 
        "skip": skip, 
        "limit": limit
    }

@router.post("/items")
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    is_service: bool = Form(False),
    stock: float = Form(0.0),
    description: str = Form(""),
    image: Optional[UploadFile] = File(None),
    variants: Optional[str] = Form(None), # Nuevo: Recibe JSON string
    extras: Optional[str] = Form(None),   # Nuevo: Recibe JSON string
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    image_url = None
    if image:
        file_content = await image.read()
        file_path = f"{tenant_id}/{uuid.uuid4().hex[:8]}.{image.filename.split('.')[-1]}"
        supabase.storage.from_("images").upload(path=file_path, file=file_content, file_options={"content-type": image.content_type})
        image_url = supabase.storage.from_("images").get_public_url(file_path)

    new_item = base.Item(
        name=name, price=price, is_service=is_service, tenant_id=tenant_id,
        image_url=image_url, stock=stock, description=description, created_at=datetime.utcnow()
    )
    db.add(new_item)
    db.flush() # Para obtener el ID antes de insertar variantes/extras

    if variants:
        v_list = json.loads(variants)
        for v in v_list:
            db.add(base.ItemVariant(item_id=new_item.id, name=v['name'], price=float(v['price']), stock=int(v.get('stock', 0))))

    if extras:
        e_list = json.loads(extras)
        for e in e_list:
            db.add(base.ItemExtra(item_id=new_item.id, name=e['name'], price=float(e['price']), stock=int(e.get('stock', 0))))
    if description:
        new_item.description = description
    else:
        new_item.description = ""
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
    variants: Optional[str] = Form(None), # Nuevo
    extras: Optional[str] = Form(None),   # Nuevo
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

    # Actualizar Variantes (Borrar y re-crear es lo más eficiente)
    if variants is not None:
        db.query(base.ItemVariant).filter(base.ItemVariant.item_id == item.id).delete()
        v_list = json.loads(variants)
        for v in v_list:
            db.add(base.ItemVariant(item_id=item.id, name=v['name'], price=float(v['price']), stock=int(v.get('stock', 0))))

    # Actualizar Extras
    if extras is not None:
        db.query(base.ItemExtra).filter(base.ItemExtra.item_id == item.id).delete()
        e_list = json.loads(extras)
        for e in e_list:
            db.add(base.ItemExtra(item_id=item.id, name=e['name'], price=float(e['price']), stock=int(e.get('stock', 0))))

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