from fastapi import WebSocket
from typing import Dict, List, Any

class ConnectionManager:
    def __init__(self):
        # Usamos Any o str porque los UUIDs se manejan mejor como strings en las llaves
        self.active_connections: Dict[Any, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: Any):
        await websocket.accept()
        # Forzamos a string para asegurar que la llave sea siempre igual
        t_id = str(tenant_id)
        if t_id not in self.active_connections:
            self.active_connections[t_id] = []
        self.active_connections[t_id].append(websocket)
        print(f"✅ Socket conectado al canal: {t_id}")

    def disconnect(self, websocket: WebSocket, tenant_id: Any):
        t_id = str(tenant_id)
        if t_id in self.active_connections:
            if websocket in self.active_connections[t_id]:
                self.active_connections[t_id].remove(websocket)
            if not self.active_connections[t_id]:
                del self.active_connections[t_id]

    async def broadcast_to_tenant(self, tenant_id: Any, message: dict):
        t_id = str(tenant_id)
        print(f"📡 Intentando broadcast a {len(self.active_connections.get(t_id, []))} clientes en {t_id}")
        if t_id in self.active_connections:
            for connection in self.active_connections[t_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"❌ Error enviando a un socket: {e}")

manager = ConnectionManager()