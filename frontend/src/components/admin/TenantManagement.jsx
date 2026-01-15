import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Plus, Minus, ExternalLink, X, Save } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const TenantManagement = ({ tenants, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [modalData, setModalData] = useState({ amount: 0, reason: "" });

  const openCreditModal = (tenant, defaultAmount) => {
    setSelectedTenant(tenant);
    setModalData({
      amount: defaultAmount,
      reason: defaultAmount > 0 ? "Recarga manual de créditos" : "Ajuste de saldo"
    });
    setIsModalOpen(true);
  };

  const handleUpdateCredits = async () => {
    if (!modalData.reason.trim()) {
      toast.error("Debes indicar un motivo");
      return;
    }

    try {
      await api.post(`/admin/tenants/${selectedTenant.id}/update-credits`, { 
        amount: parseInt(modalData.amount),
        reason: modalData.reason 
      });
      
      toast.success("Billetera actualizada correctamente");
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error("Error al actualizar créditos");
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.post(`/admin/tenants/${id}/toggle-status`);
      toast.success("Estado actualizado");
      onRefresh();
    } catch (err) {
      toast.error("Error al cambiar estado");
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-black uppercase text-slate-900 italic tracking-tighter">Lista de Negocios</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o slug..." 
              className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 w-full md:w-64 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="px-6 py-4">Negocio</th>
                <th className="px-6 py-4">Wallet / Créditos</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs italic">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{tenant.name}</p>
                        <a href={`/shop/${tenant.slug}`} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 font-medium hover:text-slate-900 flex items-center gap-1">
                          /{tenant.slug} <ExternalLink size={10}/>
                        </a>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => openCreditModal(tenant, -1)}
                        className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-md transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className={`text-sm font-black w-12 text-center ${tenant.wallet_balance > 0 ? 'text-slate-900' : 'text-red-500 animate-pulse'}`}>
                        {tenant.wallet_balance}
                      </span>
                      <button 
                        onClick={() => openCreditModal(tenant, 10)}
                        className="p-1 hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 rounded-md transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {tenant.is_active ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-2 py-1 rounded-lg w-fit text-center">
                        <CheckCircle size={12} /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 font-black text-[10px] uppercase bg-red-50 px-2 py-1 rounded-lg w-fit">
                        <XCircle size={12} /> Suspendido
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(tenant.id)}
                      className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-sm ${
                        tenant.is_active 
                          ? 'bg-white text-red-500 border border-red-100 hover:bg-red-500 hover:text-white' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {tenant.is_active ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRÉDITOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h4 className="font-black italic uppercase tracking-tighter text-slate-900">Ajustar Billetera</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTenant?.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Cantidad (Positivo suma, Negativo resta)</label>
                <input 
                  type="number"
                  value={modalData.amount}
                  onChange={(e) => setModalData({...modalData, amount: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Motivo del Ajuste</label>
                <textarea 
                  value={modalData.reason}
                  onChange={(e) => setModalData({...modalData, reason: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 min-h-[100px]"
                  placeholder="Ej: Pago recibido por transferencia..."
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Fecha de Registro</span>
                <span className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase text-slate-400 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateCredits}
                className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <Save size={14} /> Guardar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;