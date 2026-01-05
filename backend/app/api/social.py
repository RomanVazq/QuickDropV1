import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import base
from app.api.business import get_current_tenant_id 
from app.services.supabase import supabase 

router = APIRouter(tags=["Social"])

@router.post("/posts")
async def create_post(
    content: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    # 1. Verificar si el negocio tiene saldo en su Wallet para publicar
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant_id).first()
    if not wallet or wallet.balance <= 0:
        raise HTTPException(status_code=403, detail="Saldo insuficiente en tu billetera para publicar.")

    image_url = None
    if image:
        try:
            ext = image.filename.split(".")[-1]
            file_path = f"posts/{tenant_id}/{uuid.uuid4()}.{ext}"
            content_bytes = await image.read()
            
            supabase.storage.from_("images").upload(
                path=file_path, 
                file=content_bytes,
                file_options={"content-type": image.content_type}
            )
            
            res = supabase.storage.from_("images").get_public_url(file_path)
            image_url = res if isinstance(res, str) else res.public_url
        except Exception as e:
            print(f"Error Supabase: {e}")

    # 2. Crear el Post
    new_post = base.Post(
        id=str(uuid.uuid4()),
        content=content,
        image_url=image_url,
        tenant_id=tenant_id,
        created_at=datetime.utcnow()
    )
    
    # 3. Descontar 1 punto del Wallet por la publicación
    wallet.balance -= 1
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.get("/my-posts")
def get_my_posts(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_tenant_id)):
    return db.query(base.Post).filter(base.Post.tenant_id == tenant_id).order_by(base.Post.created_at.desc()).all()

@router.get("/feed/{slug}")
def get_business_feed(slug: str, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host # Obtenemos la IP de quien consulta
    
    tenant = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    posts = db.query(base.Post).filter(base.Post.tenant_id == tenant.id).order_by(base.Post.created_at.desc()).all()
    
    result = []
    for p in posts:
        # Contamos los likes totales
        likes_count = db.query(base.Like).filter(base.Like.post_id == p.id).count()
        
        # VERIFICACIÓN CLAVE: ¿Esta IP ya le dio like a este post?
        user_has_liked = db.query(base.Like).filter_by(
            post_id=p.id, 
            client_identifier=client_ip
        ).first() is not None
        
        result.append({
            "id": p.id,
            "content": p.content,
            "image_url": p.image_url,
            "created_at": p.created_at,
            "likes_count": likes_count,
            "is_liked": user_has_liked  # Nuevo campo booleano
        })
    
    return result

@router.post("/posts/{post_id}/like")
def toggle_like(post_id: str, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    
    # 1. Verificar que el post existe
    post = db.query(base.Post).filter(base.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")

    # 2. Buscar si ya existe el like de esta IP
    existing = db.query(base.Like).filter_by(post_id=post_id, client_identifier=client_ip).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "unliked"}
    
    # Dar Like
    new_like = base.Like(
        id=str(uuid.uuid4()), 
        post_id=post_id, 
        client_identifier=client_ip
    )
    # post.likes_count += 1
    
    db.add(new_like)
    db.commit()
    return {"action": "liked"}

@router.delete("/posts/{post_id}")
def delete_post(post_id: str, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_tenant_id)):
    post = db.query(base.Post).filter(base.Post.id == post_id, base.Post.tenant_id == tenant_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado o no tienes permiso para eliminarlo.")
    
    db.delete(post)
    db.commit()
    return {"detail": "Post eliminado correctamente."}  