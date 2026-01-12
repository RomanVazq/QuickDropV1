import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, UserPlus, Trash2, Edit3, Shield, User, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ email: '', password: '', is_superuser: false });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users'); // Asegúrate de crear este endpoint
      setUsers(res.data);
    } catch (err) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, formData);
        toast.success("Usuario actualizado");
      } else {
        await api.post('/admin/users', formData);
        toast.success("Usuario creado");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error en la operación");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-8">
      {/* HEADER DEL CRUD */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-black uppercase text-slate-900 italic tracking-tighter">Gestión de Usuarios</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acceso administrativo</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar email..." 
              className="bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-slate-900 w-full md:w-48"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setSelectedUser(null); setFormData({email:'', password:'', is_superuser: false}); setShowModal(true); }}
            className="bg-slate-900 text-white p-2.5 rounded-xl hover:scale-105 transition-transform"
          >
            <UserPlus size={18} />
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Tenant ID</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.filter(u => u.email.includes(searchTerm)).map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <User size={14} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  {user.is_superuser ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase">
                      <Shield size={10} /> Superadmin
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">Usuario</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">{user.tenant_id || 'N/A'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setSelectedUser(user); setFormData({email: user.email, is_superuser: user.is_superuser}); setShowModal(true); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Edit3 size={16}/></button>
                  <button onClick={() => deleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (Portal de formulario) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-black uppercase text-slate-900 italic tracking-tighter">
                {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                <input 
                  type="email" required
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm mt-1 focus:ring-2 focus:ring-slate-900"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              {!selectedUser && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                  <input 
                    type="password" required
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm mt-1 focus:ring-2 focus:ring-slate-900"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <input 
                  type="checkbox"
                  id="is_admin"
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  checked={formData.is_superuser}
                  onChange={(e) => setFormData({...formData, is_superuser: e.target.checked})}
                />
                <label htmlFor="is_admin" className="text-xs font-bold text-slate-700 uppercase">Privilegios de Superadmin</label>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black uppercase py-4 rounded-2xl text-xs tracking-widest shadow-lg shadow-slate-900/20">
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;