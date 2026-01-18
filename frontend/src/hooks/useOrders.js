import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const useOrders = (filter) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'all'
        ? '/orders/my-orders'
        : `/orders/my-orders?status=${filter}`;

      const res = await api.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);

      const statusPriority = { 'pending': 0, 'completed': 1, 'cancelled': 2 };

      const sortedOrders = [...data].sort((a, b) => {
        if (statusPriority[a.status] !== statusPriority[b.status]) {
          return statusPriority[a.status] - statusPriority[b.status];
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setOrders(sortedOrders);
    } catch (err) {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success(`Estado actualizado: ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  return {
    orders,
    loading,
    updateStatus,
    fetchOrders
  };
};

export default useOrders;