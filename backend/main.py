from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Importaciones de la aplicación
from app.database.session import engine, Base, get_db
from app.api import orders, auth, business, social, super_admin, admin
from app.models.base import Tenant, Item

# Inicializar tablas (Considera usar Alembic para migraciones en el futuro)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SaaS Business Multi-Tenant",
    description="Backend para la gestión multi-tenant de negocios",
    version="1.0.0"
)

# Configuración de CORS
# En producción, cambia ["*"] por ["http://tu-dominio-frontend.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://quickdropv1.onrender.com"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Registro de Rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(business.router, prefix="/api/v1/business", tags=["Gestión de Negocio"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Pedidos Públicos"])
app.include_router(social.router, prefix="/api/v1/social", tags=["Capa Social"])
app.include_router(super_admin.router, prefix="/api/v1/admin", tags=["Super Admin"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administración"])

@app.get("/", tags=["Salud"])
def health_check():
    return {
        "status": "ready", 
        "environment": "production",
        "timestamp": "2026-01-03T12:52:41Z"
    }
