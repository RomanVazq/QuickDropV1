import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users, Store, CreditCard, TrendingUp,
  Search, MoreVertical, CheckCircle, XCircle,
  AlertCircle, DollarSign, ArrowUpRight, Plus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { toast } from 'react-hot-toast';
import UserManagement from '../components/admin/UserManagement';
import TenantManagement from '../components/admin/TenantManagement';
import TransactionHistory from '../components/admin/TransactionHistory';
import CreateTenantModal from '../components/admin/CreateTenantModal';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  useEffect(() => {
    fetchAdminData();
  }, []);

  const onRefresh = () => {
    setLoading(true);
    fetchAdminData();
  };
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
        window.location.href = '/login';
      } else if (err.response?.status === 401) {
        toast.error("Sesión expirada, vuelve a iniciar sesión");
        window.location.href = '/login';
      } else {
        toast.error("Error al cargar datos del sistema");
        window.location.href = '/login';
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
            <h3 className="font-black uppercase text-xs text-slate-400 mb-6 tracking-widest">Creditos restantes de Negocios</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenants.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="wallet_balance" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-black uppercase text-xs text-slate-400 mb-6 tracking-widest">Pedidos totales por negocio</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenants.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="total_orders" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Plus size={16} /> Nuevo Negocio
        </button>
        {isCreateModalOpen && (
          <CreateTenantModal
            isOpen={isCreateModalOpen}
            onClose={() => { setIsCreateModalOpen(false); onRefresh(); }}
          />
        )}
        <UserManagement />
        {/* TENANTS TABLE */}
        <TenantManagement tenants={tenants} onRefresh={onRefresh} />
        <div className="mt-12">
          <TransactionHistory />
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