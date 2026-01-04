import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Lee las credenciales del archivo .env
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("⚠️ ADVERTENCIA: SUPABASE_URL o SUPABASE_KEY no configuradas en el .env")

# Inicializa el cliente
supabase: Client = create_client(url, key)