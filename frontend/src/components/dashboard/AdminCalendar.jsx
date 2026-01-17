import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Clock, User, 
  MessageCircle, Calendar as CalendarIcon, X, 
  ShoppingBag, Tag, CreditCard, Info
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, addDays, isSameMonth, isSameDay, 
  addMonths, subMonths 
} from 'date-fns';
import { es } from 'date-fns/locale';

const AdminCalendar = ({ orders = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const appointments = orders.filter(order => order.appointment_datetime);

 
  const renderHeader = () => (
    <div className="flex items-center justify-between px-8 py-8 bg-slate-900 rounded-t-[40px] text-white">
      <div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Agenda <span className="text-teal-400">QuickDrop</span></h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{format(currentMonth, 'MMMM yyyy', { locale: es })}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ChevronLeft size={20} /></button>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ChevronRight size={20} /></button>
      </div>
    </div>
  );

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayAppointments = appointments.filter(app => {
          try { return isSameDay(new Date(app.appointment_datetime), cloneDay); } catch { return false; }
        });
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div key={day.toString()} onClick={() => setSelectedDate(cloneDay)}
            className={`min-h-[110px] p-2 border-r border-b border-slate-50 transition-all cursor-pointer relative ${!isSameMonth(day, monthStart) ? "opacity-20" : isSelected ? "bg-teal-50/40" : "bg-white hover:bg-slate-50"}`}>
            <span className={`text-xs font-black p-1 rounded-md ${isToday ? "bg-teal-500 text-white" : "text-slate-400"}`}>{format(day, "d")}</span>
            <div className="mt-2 space-y-1">
              {dayAppointments.slice(0, 2).map((app, idx) => (
                <div key={idx} className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md font-bold truncate">
                  {format(new Date(app.appointment_datetime), 'HH:mm')}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="bg-white">{rows}</div>;
  };

  return (
    <div className="max-w-5xl mx-auto mb-20 animate-in fade-in zoom-in duration-500">
      <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
        {renderHeader()}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
            <div key={i} className="py-4 text-[10px] font-black uppercase text-slate-400 text-center">{d}</div>
          ))}
        </div>
        {renderCells()}
      </div>

      {/* LISTA DE CITAS DEL DÍA */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments
          .filter(app => isSameDay(new Date(app.appointment_datetime), selectedDate))
          .map((app, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedAppointment(app)}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-500 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xs italic">
                  <span className="text-teal-400">{format(new Date(app.appointment_datetime), 'HH:mm')}</span>
                </div>
                <div>
                  <h4 className="font-black uppercase text-sm italic">{app.customer_name || 'Cliente'}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{app.items?.[0]?.name || 'Ver detalle'}</p>
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-teal-500 group-hover:text-white transition-all">
                <Info size={18} />
              </div>
            </div>
          ))}
      </div>

      {/* --- MODAL DE DETALLE DE LA CITA --- */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header del Modal */}
            <div className="bg-slate-900 p-8 text-white relative">
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <span className="bg-teal-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Detalles del Pedido
              </span>
              <h3 className="text-3xl font-black uppercase italic leading-none">
                {selectedAppointment.customer_name}
              </h3>
              <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold text-xs uppercase">
                <Clock size={14} className="text-teal-400" />
                {format(new Date(selectedAppointment.appointment_datetime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-8 space-y-6">
              {/* Productos/Servicios */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={12} /> Items Solicitados
                </p>
                {selectedAppointment.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-black text-sm uppercase italic text-slate-800">{item.item_name}</p>
                      <p className="text-[10px] font-bold text-slate-400">CANTIDAD: {item.quantity || 1}</p>
                    </div>
                    <span className="font-black text-slate-900">${item.unit_price}</span>
                  </div>
                ))}
              </div>

              {/* Notas y Total */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Pedido</p>
                  <p className="text-xl font-black text-slate-900 italic">${selectedAppointment.total_amount || '0.00'}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                  <p className="text-[9px] font-black text-teal-600 uppercase mb-1">Estado</p>
                  <p className="text-xs font-bold text-teal-700 uppercase">Confirmado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;