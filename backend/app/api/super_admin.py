from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.auth import get_super_user # La dependencia que creamos
from app.services.admin_service import AdminService
from app.core import security
from app.models import base

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

@router.get("/users")
def get_admin_users(db: Session = Depends(get_db), admin = Depends(get_super_user)):
    return db.query(base.User).all()

@router.post("/users")
def create_admin_user(user_data: dict, db: Session = Depends(get_db), admin = Depends(get_super_user)):
    # Verificar si el email ya existe
    existing_user = db.query(base.User).filter(base.User.email == user_data['email']).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    new_user = base.User(
        email=user_data['email'],
        hashed_password=security.get_password_hash(user_data['password']),
        is_superuser=user_data.get('is_superuser', False)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}")
def update_admin_user(user_id: int, user_data: dict, db: Session = Depends(get_db), admin = Depends(get_super_user)):
    user = db.query(base.User).filter(base.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.email = user_data.get('email', user.email)
    user.is_superuser = user_data.get('is_superuser', user.is_superuser)
    
    # Si viene un password nuevo, lo hasheamos
    if user_data.get('password'):
        user.hashed_password = security.get_password_hash(user_data['password'])
        
    db.commit()
    return {"status": "updated"}

@router.delete("/users/{user_id}")
def delete_admin_user(user_id: str, db: Session = Depends(get_db), admin = Depends(get_super_user)):
    user = db.query(base.User).filter(base.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Seguridad: No permitir que el admin se borre a sí mismo
    if user.email == admin.email:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")

    db.delete(user)
    db.commit()
    return {"status": "deleted"}    

@router.post("/tenants/{tenant_id}/update-credits")
def update_tenant_credits(
    tenant_id: str, 
    data: dict, 
    db: Session = Depends(get_db), 
    admin = Depends(get_super_user)
):
    amount = data.get("amount", 0)
    reason = data.get("reason", "Ajuste manual por administrador")
    
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant_id).first()
    tenant = db.query(base.Tenant).filter(base.Tenant.id == tenant_id).first()
    
    if not wallet or not tenant:
        raise HTTPException(status_code=404, detail="No se encontró el negocio o wallet")

    # Guardamos saldos para el historial
    prev_bal = int(wallet.balance)
    wallet.balance += amount
    new_bal = int(wallet.balance)
    
    # Crear el registro del historial
    transaction_log = base.WalletTransaction(
        tenant_id=tenant_id,
        amount=amount,
        previous_balance=prev_bal,
        new_balance=new_bal,
        reason=reason
    )

    # Auto-reactivación
    if wallet.balance > 0 and not tenant.is_active:
        tenant.is_active = True
        
    db.add(transaction_log)
    db.commit()
    return {"status": "ok", "new_balance": new_bal}    

@router.get("/transactions")
def get_tenants_transactions(
    db: Session = Depends(get_db), 
    admin = Depends(get_super_user)
):
    transactions = db.query(base.WalletTransaction).order_by(base.WalletTransaction.created_at.desc()).all()
    return transactions
   