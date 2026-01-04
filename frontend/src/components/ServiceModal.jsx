import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useParams } from 'react-router-dom';

const ServiceModal = ({ isOpen, onClose, item, onConfirm }) => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [busyTimes, setBusyTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Horarios base del negocio (puedes traer esto del backend luego)
  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  useEffect(() => {
    if (selectedDate) {
      fetchBusyTimes();
    }
  }, [selectedDate]);

  const fetchBusyTimes = async () => {
    setLoadingTimes(true);
    try {
      const res = await api.get(`/business/public/availability/${slug}?date=${selectedDate}`);
      setBusyTimes(res.data.busy_times); // Ej: ["10:00", "14:00"]
    } catch (err) {
      console.error("Error cargando disponibilidad");
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleTimeSelection = (time) => {
    const fullDateTime = `${selectedDate}T${time}`;
    onConfirm(item.id, fullDateTime);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 animate-in slide-in-from-bottom-20">
        <h3 className="text-2xl font-black uppercase italic mb-2">Agendar {item?.name}</h3>
        
        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">1. Selecciona el día</label>
        <input 
          type="date" 
          min={new Date().toISOString().split('T')[0]} // No permitir pasado
          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 outline-none mb-6 font-bold"
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {selectedDate && (
          <>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">
              2. Selecciona la hora {loadingTimes && "(Cargando...)"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map(time => {
                const isBusy = busyTimes.includes(time);
                return (
                  <button
                    key={time}
                    disabled={isBusy || loadingTimes}
                    onClick={() => handleTimeSelection(time)}
                    className={`p-3 rounded-xl font-black text-xs transition-all ${
                      isBusy 
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through' 
                        : 'bg-slate-900 text-white active:scale-95'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button onClick={onClose} className="w-full mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ServiceModal;