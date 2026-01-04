from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models import base

router = APIRouter(tags=["Admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    # 1. Contar total de negocios
    total_tenants = db.query(base.Tenant).count()
    
    # 2. Sumar saldo de todas las billeteras (Ingresos teóricos)
    total_revenue = db.query(func.sum(base.Wallet.balance)).scalar() or 0
    
    # 3. Contar total de posts en la plataforma
    total_posts = db.query(base.Post).count()
    
    return {
        "total_tenants": total_tenants,
        "total_revenue": total_revenue,
        "active_posts": total_posts,
        "active_users": total_tenants # Simplificado: un usuario por negocio
    }

@router.get("/tenants")
def get_admin_tenants(db: Session = Depends(get_db)):
    # Ejecutamos la consulta
    results = db.query(
        base.Tenant.id,
        base.Tenant.name,
        base.Tenant.slug,
        base.Wallet.balance
    ).join(base.Wallet, base.Tenant.id == base.Wallet.tenant_id).all()
    
    # IMPORTANTE: Convertimos manualmente las tuplas a una lista de diccionarios
    # Esto soluciona el ValueError de serialización
    formatted_tenants = []
    for row in results:
        formatted_tenants.append({
            "id": row[0],
            "name": row[1],
            "slug": row[2],
            "wallet_balance": row[3]
        })
    
    return formatted_tenants

@router.post("/tenants/{tenant_id}/toggle-status")
def toggle_tenant_status(tenant_id: str, db: Session = Depends(get_db)):
    tenant = db.query(base.Tenant).filter(base.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    # Invertimos el estado (Si está activo se desactiva y viceversa)
    tenant.is_active = not tenant.is_active
    db.commit()
    
    return {"message": "Estado actualizado", "is_active": tenant.is_active}