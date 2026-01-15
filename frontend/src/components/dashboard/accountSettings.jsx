import React, { useState, useEffect } from 'react';
import { User, Phone, Globe, ArrowRight, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export const AccountSettings = ({ data }) => {
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(false);

  // 1. Estados iniciales limpios
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    slug: '',
    appointment_interval: 30
  });

  const [hours, setHours] = useState([]);

  // 2. EFECTO CLAVE: Sincronizar cuando 'data' cambie
  useEffect(() => {
    if (data) {
      // Ajuste de perfil (quitamos el anidamiento innecesario si data ya es el objeto)
      setProfile({
        name: data.name || '',
        phone: data.phone || '',
        slug: data.slug || '',
        appointment_interval: data.appointment_interval || 30
      });

      if (data.business_hours) {
        const daysMap = {
          1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 
          4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
        };
        
        const formatted = data.business_hours.map(bh => ({
          id: bh.day_of_week,
          day: daysMap[bh.day_of_week],
          open: bh.open_time,
          close: bh.close_time,
          closed: bh.is_closed
        }));

        // Ordenar para que aparezca de Lunes a Domingo
        const sorted = formatted.sort((a, b) => (a.id === 0 ? 7 : a.id) - (b.id === 0 ? 7 : b.id));
        setHours(sorted);
      }
    }
  }, [data]);

  const handleGlobalSave = async () => {
    setLoading(true);
    try {
      await api.patch('/business/profile', profile);
      const hoursPayload = {
        hours: hours.map(h => ({
          day_of_week: h.id,
          open_time: h.open,
          close_time: h.close,
          is_closed: h.closed
        }))
      };
      await api.post('/business/hours', hoursPayload);
      toast.success("Información actualizada");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  // 3. Renderizado condicional si no hay datos todavía
  if (!hours.length && !profile.name) {
      return (
          <div className="flex justify-center p-20">
              <Loader2 className="animate-spin text-blue-600" />
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 md:p-6 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-blue-900/30 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
             Ajustes
          </h1>
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Negocio: {profile.name}</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl w-full md:w-auto border border-white/10">
          {['identity', 'hours'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none md:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'identity' ? 'Identidad' : 'Horarios'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'identity' ? (
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nombre Comercial" icon={<User size={12}/>}>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                  />
                </Field>
                <Field label="WhatsApp" icon={<Phone size={12}/>}>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                  />
                </Field>
              </div>

              <Field label="URL Personalizada" icon={<Globe size={12}/>}>
                <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border-2 border-transparent focus-within:border-blue-600 transition-all">
                  <span className="px-4 text-slate-400 text-[10px] font-black uppercase border-r border-slate-200">quickdrop.com/</span>
                  <input
                    type="text"
                    value={profile.slug}
                    onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full bg-transparent py-3 px-4 text-sm font-bold outline-none"
                  />
                </div>
              </Field>

              <Field label="Intervalo de Citas" icon={<Clock size={12}/>}>
                <select
                  value={profile.appointment_interval}
                  onChange={(e) => setProfile({ ...profile, appointment_interval: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:border-blue-600 outline-none transition-all cursor-pointer"
                >
                  {[15, 30, 45, 60].map(val => (
                    <option key={val} value={val}>{val === 60 ? '1 hora' : `${val} minutos`}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            /* LISTADO DE HORARIOS */
            <div className="bg-white rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm space-y-2">
              {hours.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-xl transition-all ${item.closed ? 'bg-slate-50 opacity-50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <span className="text-[10px] font-black uppercase text-slate-900 w-16 md:w-24">{item.day}</span>
                  
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">
                    <input
                      type="time"
                      disabled={item.closed}
                      value={item.open}
                      onChange={(e) => { const n = [...hours]; n[index].open = e.target.value; setHours(n); }}
                      className="bg-transparent text-[11px] font-black outline-none disabled:opacity-30"
                    />
                    <span className="text-slate-300">-</span>
                    <input
                      type="time"
                      disabled={item.closed}
                      value={item.close}
                      onChange={(e) => { const n = [...hours]; n[index].close = e.target.value; setHours(n); }}
                      className="bg-transparent text-[11px] font-black outline-none disabled:opacity-30"
                    />
                  </div>

                  <button
                    onClick={() => { const n = [...hours]; n[index].closed = !n[index].closed; setHours(n); }}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${item.closed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                  >
                    {item.closed ? 'OFF' : 'ON'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <button
            onClick={handleGlobalSave}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Actualizar <ArrowRight size={14}/></>}
          </button>

          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-400">
              <CheckCircle2 size={14} /> Tips QuickDrop
            </h4>
            <ul className="space-y-3">
              <Tip>Usa un <b className="text-white">slug corto</b> para tus redes.</Tip>
              <Tip>Valida tu <b className="text-white">WhatsApp</b> con lada.</Tip>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
      {icon} {label}
    </label>
    {children}
  </div>
);

const Tip = ({ children }) => (
  <li className="text-[11px] font-medium text-slate-400 leading-snug flex gap-2">
    <span className="text-blue-500">•</span>
    <span>{children}</span>
  </li>
);

export default AccountSettings;