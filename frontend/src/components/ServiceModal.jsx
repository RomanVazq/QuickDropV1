import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useParams } from 'react-router-dom';
import alertSound from '../assets/sound.mp3';

const ServiceModal = ({ isOpen, onClose, item, onConfirm, businessHours, interval, tenantId }) => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [busyTimes, setBusyTimes] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [lastBookedTime, setLastBookedTime] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const interval_ = interval || 30;

  const fetchBusyTimes = useCallback(async (date) => {
    if (!date || !slug) return;
    try {
      const res = await api.get(`/business/public/availability/${slug}?date=${date}`);
      const normalized = (res.data.busy_times || []).map(t => t.substring(0, 5));
      setBusyTimes(normalized);
    } catch (err) {
      console.error("Error disponibilidad:", err);
    }
  }, [slug]);

  useEffect(() => {
    if (!isOpen || !tenantId || !selectedDate) return;
    const getWsHost = () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) return window.location.host;
      return baseUrl.replace(/^https?:\/\//, '').split('/')[0];
    };

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = getWsHost();
    const wsUrl = `${protocol}://${host}/ws/${tenantId}`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => console.log("✅ WebSocket conectado a:", wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "NEW_ORDER" && data.appointment) {
          const [bookedDate, bookedFullTime] = data.appointment.split('T');
          const bookedHour = bookedFullTime.substring(0, 5);

          if (bookedDate === selectedDate) {
            setLastBookedTime(bookedHour);
            setShowAlert(true);
            
            // Sonido y actualización de estado
            const audio = new Audio(alertSound);
            audio.play().catch(() => console.log("Audio bloqueado por el navegador"));
            
            setBusyTimes(prev => prev.includes(bookedHour) ? prev : [...prev, bookedHour]);
            setTimeout(() => setShowAlert(false), 6000);
          }
        }
      } catch (err) {
        console.error("Error en mensaje WS:", err);
      }
    };

    socket.onerror = (err) => console.error("❌ Error WebSocket:", err);

    return () => {
      if (socket.readyState === 1) socket.close();
    };
  }, [isOpen, tenantId, selectedDate]);

  const generateSlots = (openStr, closeStr, intervalMins) => {
    const slots = [];
    const [startH, startM] = openStr.split(':').map(Number);
    let [endH, endM] = closeStr.split(':').map(Number);
    if (endH === 0 && endM === 0) endH = 24;
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      currentMinutes += intervalMins;
    }
    return slots;
  };

  useEffect(() => {
    if (selectedDate && businessHours?.length > 0) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayConfig = businessHours.find(h => Number(h.day_of_week) === dateObj.getDay());

      if (dayConfig && !dayConfig.is_closed) {
        let slots = generateSlots(dayConfig.open_time, dayConfig.close_time, interval_);
        const now = new Date();
        if (selectedDate === now.toISOString().split('T')[0]) {
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          slots = slots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            return (h * 60 + m) > currentTotalMinutes;
          });
        }
        setAvailableSlots(slots);
        fetchBusyTimes(selectedDate);
      } else {
        setAvailableSlots([]);
        setBusyTimes([]);
      }
    }
  }, [selectedDate, businessHours, interval_, fetchBusyTimes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 animate-in slide-in-from-bottom-20 duration-300 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black uppercase italic text-slate-900">Agendar</h3>
            <p className="text-orange-500 font-black text-[10px] uppercase tracking-tighter">{item?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">✕</button>
        </div>

        <div className="h-12 mb-2">
          {showAlert && (
            <div className="bg-orange-500 text-white p-3 rounded-2xl flex items-center gap-3 animate-bounce">
              <span className="text-[10px] font-black uppercase">¡ALGUIEN RESERVÓ A LAS {lastBookedTime}!</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-black"
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {selectedDate && (
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {availableSlots.map(time => {
                const isBusy = busyTimes.includes(time);
                return (
                  <button
                    key={time}
                    disabled={isBusy}
                    onClick={() => onConfirm(item.id, `${selectedDate}T${time}`)}
                    className={`p-3 rounded-xl font-black text-xs transition-all ${
                      isBusy ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;