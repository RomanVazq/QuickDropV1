from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models import base

router = APIRouter()

# Nota: En producción, aquí deberías validar que el usuario tenga is_superuser = True
@router.get("/global-stats")
def get_global_stats(db: Session = Depends(get_db)):
    total_biz = db.query(base.Tenant).count()
    total_orders = db.query(base.Order).count()
    tokens_circulating = db.query(func.sum(base.Wallet.balance)).scalar() or 0
    
    return {
        "total_negocios": total_biz,
        "total_pedidos": total_orders,
        "tokens_en_sistema": tokens_circulating
    }

@router.post("/recharge-tokens/{slug}")
def manual_recharge(slug: str, amount: int, db: Session = Depends(get_db)):
    biz = db.query(base.Tenant).filter(base.Tenant.slug == slug).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    biz.wallet.balance += amount
    db.commit()
    return {"new_balance": biz.wallet.balance}