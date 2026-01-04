from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database.session import get_db
from app.models import base
from app.core import security
from app.schemas.auth import BusinessRegister
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

from jose import jwt, JWTError # Asegúrate de tener 'python-jose' instalado

# Función para obtener el usuario actual desde el Token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificamos el token usando la clave secreta de tu archivo security
        payload = jwt.decode(
            token, 
            security.SECRET_KEY, 
            algorithms=[security.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(base.User).filter(base.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
@router.post("/register")
def register_business(data: BusinessRegister, db: Session = Depends(get_db)):
    # 1. Verificar si el slug o email ya existen (Usamos data.slug y data.email)
    if db.query(base.Tenant).filter(base.Tenant.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="El nombre de la URL ya está en uso")
    
    # 2. Crear el Negocio (Tenant)
    new_tenant = base.Tenant(name=data.business_name, slug=data.slug)
    db.add(new_tenant)
    db.flush() 

    # 3. Crear la Billetera
    new_wallet = base.Wallet(tenant_id=new_tenant.id, balance=10)
    db.add(new_wallet)

    # 4. Crear el Usuario Dueño
    new_user = base.User(
        email=data.email,
        hashed_password=security.get_password_hash(data.password),
        tenant_id=new_tenant.id,
        phone=data.phone or None
    )
    db.add(new_user)
    db.commit()
    return {"message": "Negocio creado con éxito"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(base.User).filter(base.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    access_token = security.create_access_token(data={"sub": user.email, "tenant_id": user.tenant_id})
    return {"access_token": access_token, "token_type": "bearer"}