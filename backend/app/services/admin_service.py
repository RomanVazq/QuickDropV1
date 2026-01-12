from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import base

class AdminService:
    @staticmethod
    def get_global_stats(db: Session):
        # Contamos totales de toda la plataforma
        total_tenants = db.query(base.Tenant).count()
        total_revenue = db.query(func.sum(base.Wallet.balance)).scalar() or 0
        active_posts = db.query(base.Post).count()
        active_users = db.query(base.User).count()

        return {
            "total_tenants": total_tenants,
            "total_revenue": total_revenue,
            "active_posts": active_posts,
            "active_users": active_users
        }

    @staticmethod
    def get_all_tenants(db: Session):
        # Traemos la información de los negocios y sus dueños (Users)
        # Asumiendo que Tenant tiene relación con User y Wallet
        tenants = db.query(base.Tenant).all()
        result = []
        for t in tenants:
            wallet = db.query(base.Wallet).filter(base.Wallet.tenant_id == t.id).first()
            owner = db.query(base.User).filter(base.User.tenant_id == t.id).first()
            result.append({
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "email": owner.email if owner else "Sin dueño",
                "wallet_balance": wallet.balance if wallet else 0,
                "is_active": t.is_active # Debes agregar esta columna si no existe
            })
        return result