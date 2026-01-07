import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base
from app.api import orders, auth, business, social, super_admin

# 1. Crear tablas
Base.metadata.create_all(bind=engine)

# 2. Leer variables de entorno
SECRET_INTERNAL_KEY = os.getenv("SECRET_INTERNAL_KEY")
ENV = os.getenv("ENV", "development")

# 3. Inicializar FastAPI (SOLO UNA VEZ)
# Si ENV es production, ocultamos las URLs de documentación
app = FastAPI(
    title="SaaS Business Multi-Tenant",
    description="Backend para la gestión multi-tenant de negocios",
    version="1.0.0",
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json"
)

# 4. Middleware de Seguridad (Debe ir antes de los routers)
@app.middleware("http")
async def verify_origin_key(request: Request, call_next):
    path = request.url.path
    
    # Permitir SIEMPRE la raíz para el health check de Render
    if path == "/":
        return await call_next(request)
    
    # Bloquear el acceso a docs manualmente por si acaso
    if path in ["/docs", "/openapi.json", "/redoc"] and ENV == "production":
        raise HTTPException(status_code=404, detail="Not Found")
        
    # Verificar la clave secreta para el resto de la API
    api_key = request.headers.get("X-Internal-Client")
    if api_key != SECRET_INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="Acceso no autorizado")
    
    return await call_next(request)

# 5. Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://quickdropv1.onrender.com"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Registro de Rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(business.router, prefix="/api/v1/business", tags=["Gestión de Negocio"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Pedidos Públicos"])
app.include_router(social.router, prefix="/api/v1/social", tags=["Capa Social"])
app.include_router(super_admin.router, prefix="/api/v1/admin", tags=["Super Admin"])

@app.get("/", tags=["Salud"])
def health_check():
    return {"status": "ready", "environment": ENV}