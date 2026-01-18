import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.websockets import WebSocket, WebSocketDisconnect
# Importaciones de tu aplicación
from app.database.session import engine, Base, get_db
from app.api import orders, auth, business, social, super_admin
from app.models.base import Tenant, Item

from app.core.websocket_manager import manager

# 1. Inicializar base de datos
Base.metadata.create_all(bind=engine)

# 2. Configuración de Variables de Entorno
# Importante: Configura ENV="production" y SECRET_INTERNAL_KEY en Render
ENV = os.getenv("ENV", "development")
SECRET_INTERNAL_KEY = os.getenv("SECRET_INTERNAL_KEY")

# 3. Inicialización de FastAPI
# Ocultamos la documentación automáticamente si estamos en producción
app = FastAPI(
    title="SaaS Business Multi-Tenant",
    description="Backend para la gestión multi-tenant de negocios",
    version="1.0.0",
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json"
)

# 4. Middleware de Seguridad (Debe ir PRIMERO)
@app.middleware("http")
async def verify_origin_key(request: Request, call_next):
    path = request.url.path
    
    # A. Permitir siempre la raíz (Health Check de Render)
    if path == "/":
        return await call_next(request)
        
    # B. Bloqueo manual de docs en producción por seguridad extra
    if path in ["/docs", "/openapi.json", "/redoc"] and ENV == "production":
        return JSONResponse(
            status_code=404,
            content={"detail": "Not Found"}
        )
    
    # C. Validar la Key de acceso interno
    # Nota: Usamos return JSONResponse en lugar de raise HTTPException 
    # para evitar errores internos en el middleware.
    api_key = request.headers.get("X-Internal-Client")
    
    if api_key != SECRET_INTERNAL_KEY:
        return JSONResponse(
            status_code=403,
            content={"detail": "Acceso no autorizado: Origen desconocido"}
        )
    
    # Si pasa las validaciones, continúa a la ruta solicitada
    return await call_next(request)

# 5. Configuración de CORS
# Se ejecuta DESPUÉS del middleware de seguridad en el flujo de respuesta
app.add_middleware(
   
    CORSMiddleware,
    allow_origins=["https://quickdrop.shop","https://www.quickdrop.shop", "http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"], # Esto permite que el header 'X-Internal-Client' pase sin problemas
)

# 6. Registro de Rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(business.router, prefix="/api/v1/business", tags=["Gestión de Negocio"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Pedidos Públicos"])
app.include_router(social.router, prefix="/api/v1/social", tags=["Capa Social"])
app.include_router(super_admin.router, prefix="/api/v1/admin", tags=["Super Admin"])

# 7. Rutas Base / Salud
@app.get("/", tags=["Salud"])
def health_check():
    return {
        "status": "ready", 
        "environment": ENV,
        "timestamp": "2026-01-03T12:52:41Z"
    }
@app.websocket("/ws/{tenant_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: str):
    await manager.connect(websocket, tenant_id)
    try:
        while True:
            # Esto mantiene la conexión abierta esperando mensajes (pings)
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
        print(f"🔌 Cliente desconectado de {tenant_id}")
    except Exception as e:
        print(f"⚠️ Error inesperado en socket: {e}")
        manager.disconnect(websocket, tenant_id)  