import React, { useState } from 'react';
import { X, Store, Globe, Phone, Lock, Clock, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const CreateTenantModal = ({ isOpen, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usamos el endpoint que compartiste anteriormente
      await api.post("/auth/register", formData);
      toast.success("¡Negocio y Administrador creados!");
      onRefresh(); // Recargar la lista de negocios
      onClose();   // Cerrar modal
      setFormData({ business_name: '', slug: '', email: '', password: '', phone: '', interval_minutes: 30 });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Error al crear el negocio";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h4 className="font-black italic uppercase tracking-tighter text-slate-900 text-xl">Registrar Nuevo Negocio</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración de Tenant y Cuenta de Dueño</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DATOS DEL NEGOCIO */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase text-indigo-500 mb-4 flex items-center gap-2">
                <Store size={14} /> Información Comercial
              </h5>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombre del Negocio</label>
                <div className="relative">
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                    placeholder="Ej: Tacos El Jefe"
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  />
                  <Store className="absolute left-3 top-3 text-slate-300" size={16} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">URL (Slug)</label>
                <div className="relative">
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-slate-900"
                    placeholder="tacos-el-jefe"
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  />
                  <Globe className="absolute left-3 top-3 text-slate-300" size={16} />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 italic">Ej: mi-dominio.com/public/<strong>slug</strong></p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Intervalo de Citas (Minutos)</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900 appearance-none"
                    value={formData.interval_minutes}
                    onChange={(e) => setFormData({...formData, interval_minutes: parseInt(e.target.value)})}
                  >
                    <option value={15}>15 Minutos</option>
                    <option value={20}>20 Minutos</option>
                    <option value={30}>30 Minutos</option>
                    <option value={60}>1 Hora</option>
                  </select>
                  <Clock className="absolute left-3 top-3 text-slate-300" size={16} />
                </div>
              </div>
            </div>

            {/* DATOS DEL ADMINISTRADOR */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase text-emerald-500 mb-4 flex items-center gap-2">
                <Lock size={14} /> Acceso Administrador
              </h5>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Email del Dueño</label>
                <input 
                  required
                  type="email"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                  placeholder="admin@negocio.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Contraseña Temporal</label>
                <input 
                  required
                  type="password"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Teléfono WhatsApp</label>
                <div className="relative">
                  <input 
                    type="tel"
                    className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                    placeholder="521234567890"
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <Phone className="absolute left-3 top-3 text-slate-300" size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 rounded-2xl text-xs font-black uppercase text-slate-400 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-900 text-white px-4 py-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? "Creando..." : <><Save size={16} /> Crear Negocio</>}
            </button>
          </div>
        </form>

        <div className="bg-amber-50 p-4 flex items-center gap-3 border-t border-amber-100">
          <AlertCircle className="text-amber-500" size={18} />
          <p className="text-[10px] font-bold text-amber-700 uppercase leading-tight">
            Al crear el negocio se le asignarán automáticamente 10 créditos de bienvenida.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateTenantModal;