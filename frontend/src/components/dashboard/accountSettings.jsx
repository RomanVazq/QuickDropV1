import React, { useState } from 'react';
import { User, Phone, Globe, ArrowRight, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export const AccountSettings = ({ data }) => {
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: data?.business?.name || '',
    phone: data?.business?.phone || '',
    slug: data?.business?.slug || '',
    appointment_interval: data?.business?.appointment_interval || 30
  });

  const [hours, setHours] = useState(data?.business?.hours || [
    { day: 'Lunes', id: 1, open: '09:00', close: '21:00', closed: false },
    { day: 'Martes', id: 2, open: '09:00', close: '21:00', closed: false },
    { day: 'Miércoles', id: 3, open: '09:00', close: '21:00', closed: false },
    { day: 'Jueves', id: 4, open: '09:00', close: '21:00', closed: false },
    { day: 'Viernes', id: 5, open: '09:00', close: '22:00', closed: false },
    { day: 'Sábado', id: 6, open: '10:00', close: '23:00', closed: false },
    { day: 'Domingo', id: 0, open: '00:00', close: '00:00', closed: true },
  ]);

  const handleGlobalSave = async () => {
    setLoading(true);
    try {
      await api.patch('/business/profile', {
        name: profile.name,
        slug: profile.slug,
        phone: profile.phone,
        appointment_interval: profile.appointment_interval || 30
      });

      const hoursPayload = {
        hours: hours.map(h => ({
          day_of_week: h.id,
          open_time: h.open,
          close_time: h.close,
          is_closed: h.closed
        }))
      };
      await api.post('/business/hours', hoursPayload);

      toast.success("Información actualizada correctamente");
    } catch (error) {
      const msg = error.response?.data?.detail || "Error al actualizar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER AZUL PREMIUM (El que pediste mantener) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 backdrop-blur-md p-6 rounded-[2.5rem] border border-blue-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
             Ajustes del Negocio
          </h1>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Gestiona tu presencia digital</p>
        </div>

        <div className="flex bg-blue-100/50 p-1.5 rounded-2xl w-fit border border-blue-200">
          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'identity' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-blue-400 hover:text-blue-600'}`}
          >
            <User size={14} /> Identidad
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'hours' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-blue-400 hover:text-blue-600'}`}
          >
            <Clock size={14} /> Disponibilidad
          </button>
        </div>
      </div>

      {/* CUERPO ORIGINAL (Diseño Slate) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'identity' ? (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User size={12} /> Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Phone size={12} /> WhatsApp (Con código de país)
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                    placeholder="5212223334444"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Globe size={12} /> Slug de tu Menú
                  </label>
                  <div className="flex items-center bg-slate-50 rounded-2xl px-6 focus-within:ring-2 focus-within:ring-slate-900 transition-all">
                    <span className="text-slate-400 text-xs font-bold whitespace-nowrap">quickdrop.com/</span>
                    <input
                      type="text"
                      value={profile.slug}
                      onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full bg-transparent border-none py-4 px-1 text-sm font-bold focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Clock size={12} /> Duración de cada cita
                  </label>
                  <select
                    value={profile.appointment_interval || 30}
                    onChange={(e) => setProfile({ ...profile, appointment_interval: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all appearance-none cursor-pointer"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-3">
              {hours.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-3xl transition-all ${item.closed ? 'bg-slate-50 opacity-50' : 'bg-slate-50'}`}>
                  <span className="text-[10px] font-black uppercase w-20 text-slate-900">{item.day}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      disabled={item.closed}
                      className="bg-white border-none rounded-xl text-[11px] font-black p-2 shadow-sm focus:ring-1 focus:ring-slate-900"
                      value={item.open}
                      onChange={(e) => {
                        const n = [...hours]; n[index].open = e.target.value; setHours(n);
                      }}
                    />
                    <span className="text-slate-300">-</span>
                    <input
                      type="time"
                      disabled={item.closed}
                      className="bg-white border-none rounded-xl text-[11px] font-black p-2 shadow-sm focus:ring-1 focus:ring-slate-900"
                      value={item.close}
                      onChange={(e) => {
                        const n = [...hours]; n[index].close = e.target.value; setHours(n);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const n = [...hours]; n[index].closed = !n[index].closed; setHours(n);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${item.closed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                  >
                    {item.closed ? 'Cerrado' : 'Abierto'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR ORIGINAL (Slate/Dark) */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Tips QuickDrop
            </h4>
            <ul className="space-y-4">
              <li className="text-[11px] font-bold text-slate-400 leading-relaxed">
                Usa un <span className="text-white">slug corto</span> y fácil de recordar para tus redes sociales.
              </li>
              <li className="text-[11px] font-bold text-slate-400 leading-relaxed">
                Mantén tu <span className="text-white">WhatsApp</span> actualizado con el código de país.
              </li>
              <li className="text-[11px] font-bold text-slate-400 leading-relaxed">
                Si cierras por festivos, usa el botón <span className="text-white">"Abierto/Cerrado"</span> para pausar pedidos.
              </li>
            </ul>
          </div>

          <button
            onClick={handleGlobalSave}
            disabled={loading}
            className="group w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-sm tracking-wide shadow-2xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:bg-slate-300"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <>
                <span>Guardar Cambios</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;