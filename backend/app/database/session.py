import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Definimos la URL con el driver pg8000 para evitar errores de tildes en Windows
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Creamos el motor de conexión
engine = create_engine(DATABASE_URL)

# 3. Creamos la fábrica de sesiones (esto lo usarán tus rutas de la API)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Definimos la base para los modelos
Base = declarative_base()

# 5. Función de ayuda para obtener la base de datos en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()