import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { Truck, Save, Loader2, DollarSign } from "lucide-react";

const AdminConfig = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState({
    has_delivery: false,
    delivery_price: 0
  });

  // 1. Cargar la configuración actual al abrir
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get("/business/me"); 
        setConfig({
          has_delivery: response.data.has_delivery || false,
          delivery_price: response.data.delivery_price || 0
        });
      } catch (err) {
        toast.error("Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // 2. Guardar los cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch("/business/update-delivery", config);
      toast.success("Configuración actualizada correctamente");
    } catch (err) {
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
          <Truck size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración de Entregas</h2>
          <p className="text-slate-500 text-sm">Gestiona cómo envías tus productos y cuánto cobras por ello.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Toggle de Habilitación */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-tight">
              Servicio a Domicilio
            </label>
            <p className="text-xs text-slate-500">Permitir que los clientes pidan entrega a su dirección.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.has_delivery}
              onChange={(e) => setConfig({...config, has_delivery: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Campo de Precio */}
        <div className={`space-y-3 transition-all duration-300 ${config.has_delivery ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <label className="block text-xs font-black text-slate-400 uppercase ml-1">Costo del Envío ($)</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <DollarSign size={18} />
            </div>
            <input 
              type="number" 
              step="0.01"
              min="0"
              disabled={!config.has_delivery}
              value={config.delivery_price}
              onChange={(e) => setConfig({...config, delivery_price: parseFloat(e.target.value) || 0})}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 pl-10 font-bold outline-none transition-all" 
              placeholder="0.00"
            />
          </div>
          <p className="text-[10px] text-slate-400 italic ml-1">
            * Este monto se sumará automáticamente al total del carrito cuando el cliente elija domicilio.
          </p>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminConfig;