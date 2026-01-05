import hashlib
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional
import os
import logging

# 1. Silenciamos las advertencias de passlib para evitar logs innecesarios
logging.getLogger("passlib").setLevel(logging.ERROR)

# Configuración básica
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# 2. Configuración robusta de CryptContext
# Forzamos 'ident="2b"' para saltar la detección automática de bugs de passlib
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__ident="2b"
)

def get_password_hash(password: str) -> str:
    # SHA-256 normaliza cualquier longitud a 64 caracteres
    pre_hash = hashlib.sha256(password.encode()).hexdigest()
    # Aseguramos que pase como string corto a passlib
    return pwd_context.hash(pre_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Aplicamos el mismo SHA-256 a la contraseña que viene del usuario
    pre_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    # Comparamos con el hash guardado en la DB
    return pwd_context.verify(pre_hash, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
   
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)