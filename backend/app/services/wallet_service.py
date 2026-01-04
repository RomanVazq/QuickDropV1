from sqlalchemy.orm import Session
from app.models import base
from fastapi import HTTPException, status

def consume_token(db: Session, tenant_id: str):
    # with_for_update() bloquea la fila para evitar gastos dobles concurrentes
    wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == tenant_id).with_for_update().first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Billetera no encontrada")
        
    if wallet.balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED, 
            detail="Saldo de tokens insuficiente"
        )
    
    wallet.balance -= 1
    db.flush() # Mantiene los cambios en la transacción sin cerrar el commit
    return wallet