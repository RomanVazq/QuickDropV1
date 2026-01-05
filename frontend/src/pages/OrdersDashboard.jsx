import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, CheckCircle, XCircle, MapPin, User, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      
      // Datos extraídos de tu JSON
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);

      // --- Lógica de Ordenamiento Estricta ---
      const statusPriority = {
        'pending': 0,
        'completed': 1,
        'cancelled': 2
      };

      const sortedOrders = [...data].sort((a, b) => {
        // 1. Prioridad por estado (0 > 1 > 2)
        if (statusPriority[a.status] !== statusPriority[b.status]) {
          return statusPriority[a.status] - statusPriority[b.status];
        }
        
        // 2. Por fecha de creación (los más recientes arriba en su sección)
        // Convertimos a Date para asegurar que el orden sea cronológico correcto
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setOrders(sortedOrders);
    } catch (err) {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status?status=${newStatus}`);
      toast.success("Estado actualizado");
      fetchOrders();
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse uppercase text-slate-400">Organizando pedidos...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
          Gestión de Pedidos
        </h2>
        <div className="flex gap-2">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
            {orders.filter(o => o.status === 'pending').length} Pendientes
          </span>
          <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
            {orders.length} Totales
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`bg-white border-2 rounded-[32px] p-6 shadow-sm border-t-8 transition-all ${
              order.status === 'pending' 
                ? 'border-orange-500 ring-4 ring-orange-500/5' 
                : 'border-slate-100 border-t-slate-900 opacity-80'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getStatusStyle(order.status)}`}>
                {order.status}
              </span>
              <span className="text-slate-400 text-[10px] font-mono">
                #{order.id.substring(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><User size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Cliente</p>
                  <p className="font-bold">{order.customer_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><MapPin size={18}/></div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] uppercase font-black text-slate-400">Dirección</p>
                  <p className="text-sm text-slate-600 truncate">{order.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><DollarSign size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Total</p>
                  <p className="text-xl font-black text-slate-900">${order.total_amount}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-dashed border-slate-100">
              {order.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-100"
                  >
                    <CheckCircle size={16}/> Completar
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    className="bg-slate-100 text-slate-400 p-3 rounded-2xl hover:text-red-500"
                  >
                    <XCircle size={20}/>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => updateStatus(order.id, 'pending')}
                  className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase border border-slate-100 hover:bg-slate-100"
                >
                  Reabrir Pedido
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersDashboard;