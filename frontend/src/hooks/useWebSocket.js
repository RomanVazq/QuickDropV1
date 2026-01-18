import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import alertSound from '../assets/sound.mp3';

const useWebSocket = (tenantId, onNewOrder) => {
  const socketRef = useRef(null);
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    if (!tenantId || socketRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'localhost:8000';
    const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
    const wsUrl = `${protocol}://${host}/ws/${tenantId}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onerror = () => {
      // Suppress WebSocket connection errors in production
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "NEW_ORDER" && !hasShownToastRef.current) {
        hasShownToastRef.current = true;
        new Audio(alertSound).play().catch(() => { });
        toast.success("¡NUEVO PEDIDO!", {
          duration: 6000,
          icon: '🔥',
          style: { background: '#0f172a', color: '#fff', fontWeight: 'bold' }
        });
        onNewOrder();
        // Reset after a delay to allow new orders
        setTimeout(() => hasShownToastRef.current = false, 1000);
      }
    };
    
    socket.onclose = () => {
      socketRef.current = null;
      hasShownToastRef.current = false;
    };
    
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [tenantId, onNewOrder]);
};

export default useWebSocket;