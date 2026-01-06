import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Package, CheckCircle, XCircle, MapPin, User, DollarSign, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Estado para el filtro: 'all', 'pending', 'completed', 'cancelled'
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Construimos la URL. Si el filtro es 'all', traemos todo.
      // Si no, enviamos el status específico al backend.
      const endpoint = filter === 'all' 
        ? '/orders/my-orders' 
        : `/orders/my-orders?status=${filter}`;
      
      const res = await api.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);

      // Mantenemos el orden de prioridad por si el backend devuelve 'all' sin ordenar
      const statusPriority = { 'pending': 0, 'completed': 1, 'cancelled': 2 };

      const sortedOrders = [...data].sort((a, b) => {
        if (statusPriority[a.status] !== statusPriority[b.status]) {
          return statusPriority[a.status] - statusPriority[b.status];
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setOrders(sortedOrders);
    } catch (err) {
      toast.error("Error al filtrar pedidos");
    } finally {
      setLoading(false);
    }
  }, [filter]); // Se dispara cada vez que el filtro cambia

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 40000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status?status=${newStatus}`);
      toast.success(`Estado: ${newStatus}`);
      fetchOrders(); 
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Gestión de Pedidos
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            {orders.length} Pedidos encontrados
          </p>
        </div>

        {/* SELECTOR DE FILTROS ESTILO CHIPS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2">
          {[
            { id: 'all', label: 'Todos', color: 'bg-slate-900' },
            { id: 'pending', label: 'Pendientes', color: 'bg-orange-500' },
            { id: 'completed', label: 'Listos', color: 'bg-green-500' },
            { id: 'cancelled', label: 'Cancelados', color: 'bg-red-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                filter === tab.id 
                  ? `${tab.color} text-white border-transparent shadow-lg scale-105` 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLA DE PEDIDOS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div 
              key={order.id} 
              className={`bg-white border-2 rounded-[32px] p-6 shadow-sm border-t-8 transition-all ${
                order.status === 'pending' ? 'border-orange-500 ring-4 ring-orange-500/5' : 'border-slate-100 border-t-slate-900'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                  order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                  order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                  {order.status}
                </span>
                <span className="text-slate-400 text-[10px] font-mono font-bold">
                  #{order.id.substring(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><User size={18}/></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-black text-slate-400">Cliente</p>
                    <p className="font-bold truncate">{order.customer_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><MapPin size={18}/></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-black text-slate-400">Dirección</p>
                    <p className="text-sm text-slate-600 truncate">{order.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><DollarSign size={18}/></div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400">Total</p>
                    <p className="text-xl font-black text-slate-900">${order.total_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-dashed border-slate-100">
                {order.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-100"
                    >
                      <CheckCircle size={16}/> Completar
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="bg-slate-100 text-slate-400 p-3 rounded-2xl hover:text-red-500 active:scale-95 transition-colors"
                    >
                      <XCircle size={20}/>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => updateStatus(order.id, 'pending')}
                    className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Reabrir Ticket
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-20 border-4 border-dashed border-slate-50 rounded-[48px]">
          <Package size={64} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest italic">No hay pedidos con este filtro</p>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;