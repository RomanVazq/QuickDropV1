import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Store, CreditCard, TrendingUp, 
  Search, MoreVertical, CheckCircle, XCircle,
  AlertCircle, DollarSign, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { toast } from 'react-hot-toast';

const SuperAdmin = () => {
  const [stats, setStats] = useState({
    total_tenants: 0,
    total_revenue: 0,
    active_posts: 0,
    active_users: 0
  });
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

const fetchAdminData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Sesión no encontrada");
      return;
    }

    const [statsRes, tenantsRes] = await Promise.all([
      api.get('/admin/global-stats', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      api.get('/admin/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    setStats(statsRes.data);
    setTenants(tenantsRes.data);
  } catch (err) {

    if (err.response?.status === 403) {
      toast.error("Acceso denegado: No eres administrador");
    } else if (err.response?.status === 401) {
      toast.error("Sesión expirada, vuelve a iniciar sesión");
      window.location.href = '/login';
    } else {
      toast.error("Error al cargar datos del sistema");
    }
  } finally {
    setLoading(false);
  }
};

  const toggleTenantStatus = async (tenantId) => {
    try {
      await api.post(`/admin/tenants/${tenantId}/toggle-status`);
      toast.success("Estado del negocio actualizado");
      fetchAdminData();
    } catch (err) {
      toast.error("No se pudo cambiar el estado");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400 animate-pulse">CARGANDO SISTEMA...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Super Admin Control</h1>
            <p className="text-slate-500 font-medium">Gestión global de la plataforma SaaS</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-slate-600 uppercase">Sistema Online</span>
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Negocios" value={stats.total_tenants} icon={<Store />} color="bg-blue-500" />
          <StatCard title="Ingresos Totales" value={`$${stats.total_revenue}`} icon={<DollarSign />} color="bg-emerald-500" />
          <StatCard title="Posts Publicados" value={stats.active_posts} icon={<TrendingUp />} color="bg-orange-500" />
          <StatCard title="Usuarios Activos" value={stats.active_users} icon={<Users />} color="bg-purple-500" />
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-black uppercase text-xs text-slate-400 mb-6 tracking-widest">Crecimiento de Negocios</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenants.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="wallet_balance" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-black uppercase text-xs text-slate-400 tracking-widest">Estado del Servidor</h3>
               <ArrowUpRight className="text-slate-300" size={20} />
            </div>
            <div className="space-y-4">
               <StatusIndicator label="Base de Datos" status="Excelente" value="99%" />
               <StatusIndicator label="Storage (Supabase)" status="Normal" value="45%" />
               <StatusIndicator label="Latencia API" status="Baja" value="120ms" />
            </div>
          </div>
        </div>

        {/* TENANTS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-black uppercase text-slate-900 italic tracking-tighter">Lista de Negocios</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o slug..." 
                className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 transition-all w-full md:w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="px-6 py-4">Negocio</th>
                  <th className="px-6 py-4">Slug / Link</th>
                  <th className="px-6 py-4">Wallet</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs italic">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{tenant.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">/{tenant.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${tenant.wallet_balance > 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {tenant.wallet_balance} pts
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.is_active ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                          <CheckCircle size={12} /> Activo
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase">
                          <XCircle size={12} /> Suspendido
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleTenantStatus(tenant.id)}
                        className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-all ${
                          tenant.is_active ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {tenant.is_active ? 'Suspender' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-componentes
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />
    <div className="relative z-10">
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-current/20`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</p>
    </div>
  </div>
);

const StatusIndicator = ({ label, status, value }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700">{status}</p>
    </div>
    <span className="text-lg font-black italic text-slate-900">{value}</span>
  </div>
);

export default SuperAdmin;