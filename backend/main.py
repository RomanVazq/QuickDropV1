from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
# Importaciones de la aplicación
from app.database.session import engine, Base, get_db
from app.api import orders, auth, business, social, super_admin
from app.models.base import Tenant, Item

# Inicializar tablas (Considera usar Alembic para migraciones en el futuro)
Base.metadata.create_all(bind=engine)

SECRET_INTERNAL_KEY = os.getenv("SECRET_INTERNAL_KEY")

@app.middleware("http")
async def verify_origin_key(request: Request, call_next):
    # Excluir rutas de docs y también la ruta de salud de Render si la usas
    if request.url.path in ["/"]:
        return await call_next(request)
        
    api_key = request.headers.get("X-Internal-Client")
    
    # IMPORTANTE: Usa una variable de entorno en lugar de texto plano
    if api_key != SECRET_INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="Acceso no autorizado")
    
    return await call_next(request)
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


@app.get("/", tags=["Salud"])
def health_check():
    return {
        "status": "ready", 
        "environment": "production",
        "timestamp": "2026-01-03T12:52:41Z"
    }
