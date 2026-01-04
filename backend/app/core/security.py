import hashlib
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

# Configuración básica
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    # 1. SHA-256 normaliza cualquier longitud a 64 caracteres
    pre_hash = hashlib.sha256(password.encode()).hexdigest()
    # 2. Bcrypt genera el hash final seguro
    return pwd_context.hash(pre_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 1. Aplicamos el mismo SHA-256 a la contraseña que viene del usuario
    pre_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    # 2. Comparamos con el hash guardado en la DB
    return pwd_context.verify(pre_hash, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt