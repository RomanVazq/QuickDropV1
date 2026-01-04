import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Clock, CheckCircle, XCircle, MapPin, User, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Opcional: Auto-refresh cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status?status=${newStatus}`);
      toast.success("Estado actualizado");
      fetchOrders();
    } catch (err) {
      toast.error("No se pudo actualizar");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse">CARGANDO ÓRDENES...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
          Gestión de Pedidos
        </h2>
        <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
          {orders.length} totales
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white border-2 border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all border-t-8 border-t-slate-900">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getStatusStyle(order.status)}`}>
                {order.status}
              </span>
              <span className="text-slate-400 text-[10px] font-bold">
                #{order.id.substring(0, 8).upperCase()}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><User size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 leading-none">Cliente</p>
                  <p className="font-bold text-slate-900">{order.customer_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><MapPin size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 leading-none">Entrega en</p>
                  <p className="font-medium text-slate-600 text-sm line-clamp-1">{order.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><DollarSign size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 leading-none">Monto Total</p>
                  <p className="text-xl font-black text-slate-900">${order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex gap-2 pt-4 border-t border-dashed border-slate-100">
              {order.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle size={16}/> Listar
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    className="bg-slate-100 text-slate-400 p-3 rounded-2xl hover:bg-red-50 transition-colors hover:text-red-500"
                  >
                    <XCircle size={20}/>
                  </button>
                </>
              )}
              {order.status !== 'pending' && (
                <button 
                  onClick={() => updateStatus(order.id, 'pending')}
                  className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-slate-100 transition-colors"
                >
                  Reabrir Ticket
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20 border-4 border-dashed border-slate-50 rounded-[48px]">
          <Package size={64} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest italic">No han llegado pedidos aún</p>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;