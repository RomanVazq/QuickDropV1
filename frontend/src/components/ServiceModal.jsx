import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useParams } from 'react-router-dom';

const ServiceModal = ({ isOpen, onClose, item, onConfirm, businessHours, businessData }) => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [busyTimes, setBusyTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Tomamos el intervalo del negocio, por defecto 30 si no existe
  const interval = businessData?.appointment_interval || 30;

  const generateSlots = (openStr, closeStr, intervalMins) => {
    const slots = [];
    const [startH, startM] = openStr.split(':').map(Number);
    let [endH, endM] = closeStr.split(':').map(Number);

    if (endH === 0 && endM === 0) endH = 24;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Ahora avanza según el intervalo configurado (15, 30, 45, 60)
    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;

      slots.push(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      );
      currentMinutes += intervalMins;
    }

    return slots;
  };

  useEffect(() => {
    if (selectedDate && businessHours && businessHours.length > 0) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay(); 

      const dayConfig = businessHours.find(h => Number(h.day_of_week) === dayOfWeek);

      if (dayConfig && !dayConfig.is_closed) {
        // Generamos slots usando el intervalo dinámico
        let slots = generateSlots(dayConfig.open_time, dayConfig.close_time, interval);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (selectedDate === todayStr) {
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          slots = slots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            return (h * 60 + m) > currentTotalMinutes;
          });
        }

        setAvailableSlots(slots);
        fetchBusyTimes();
      } else {
        setAvailableSlots([]);
        setBusyTimes([]);
      }
    }
  }, [selectedDate, businessHours, interval]);

  const fetchBusyTimes = async () => {
    setLoadingTimes(true);
    try {
      const res = await api.get(`/business/public/availability/${slug}?date=${selectedDate}`);
      setBusyTimes(res.data.busy_times || []);
    } catch (err) {
      console.error("Error cargando disponibilidad:", err);
      setBusyTimes([]);
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
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 animate-in slide-in-from-bottom-20 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black uppercase italic leading-none text-slate-900">Agendar</h3>
            <p className="text-orange-500 font-black text-sm uppercase">{item?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">
              1. Selecciona el día
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 outline-none font-bold transition-all"
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {selectedDate && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">
                2. Horas disponibles {loadingTimes && "..."}
              </label>

              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableSlots.map(time => {
                    const isBusy = busyTimes.includes(time);
                    return (
                      <button
                        key={time}
                        disabled={isBusy || loadingTimes}
                        onClick={() => handleTimeSelection(time)}
                        className={`p-3 rounded-xl font-black text-xs transition-all ${isBusy
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                            : 'bg-slate-900 text-white active:scale-95 hover:bg-orange-500 shadow-md'
                          }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-red-50 rounded-[2rem] text-center border border-red-100">
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter">
                    No hay citas disponibles para este día
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
        >
          Volver al menú
        </button>
      </div>
    </div>
  );
};

export default ServiceModal;