import React, { useState, useEffect } from 'react';
import { Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../../services/api';

const TransactionHistory = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await api.get('/admin/transactions');
    setLogs(res.data);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-50">
        <h3 className="font-black uppercase text-slate-900 italic tracking-tighter">Historial de Movimientos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Negocio</th>
              <th className="px-6 py-4">Cambio</th>
              <th className="px-6 py-4">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="text-sm">
                <td className="px-6 py-4 text-slate-400 font-medium">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">
                  {log.tenant_name} {/* Necesitarás un join en el backend */}
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1 font-black ${log.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {log.amount > 0 ? <ArrowUpCircle size={14}/> : <ArrowDownCircle size={14}/>}
                    {log.amount > 0 ? `+${log.amount}` : log.amount}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 italic text-xs">
                  {log.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;