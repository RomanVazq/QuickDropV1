from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.auth import get_super_user # La dependencia que creamos
from app.services.admin_service import AdminService

router = APIRouter()

@router.get("/global-stats")
def get_stats(db: Session = Depends(get_db), admin = Depends(get_super_user)):
    return AdminService.get_global_stats(db)

@router.get("/tenants")
def get_tenants(db: Session = Depends(get_db), admin = Depends(get_super_user)):
    return AdminService.get_all_tenants(db)

@router.post("/tenants/{tenant_id}/toggle-status")
def toggle_tenant(tenant_id: str, db: Session = Depends(get_db), admin = Depends(get_super_user)):
    from app.models import base
    tenant = db.query(base.Tenant).filter(base.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404)
    
    tenant.is_active = not getattr(tenant, 'is_active', True)
    db.commit()
    return {"status": "updated"}