import React, { useState } from 'react';
import { Minus, Plus, MessageSquare, Loader2, ShoppingBag, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom'; // Para obtener el slug
import api from '../services/api';
import { toast } from 'react-hot-toast';

const PublicCart = ({ 
  cartArray, 
  updateQuantity, 
  setStep, 
  formData, 
  setFormData, 
  cartTotal, 
  hasService, 
  business 
}) => {
  const { slug } = useParams(); // Obtenemos el slug de la URL
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. ESTRUCTURA SEGÚN TU OrderCreateSchema
      const payload = {
        customer_name: formData.customer_name,
        address: hasService ? "SERVICIO EN LOCAL" : formData.address,
        appointment_datetime: formData.appointment_datetime || null,
        notes: formData.notes || "",
        items: cartArray.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      // 2. LLAMADA AL ENDPOINT QUE PROPORCIONASTE
      const response = await api.post(`/orders/public/place-order/${slug}`, payload);
      const { order_id, resumen, business_phone, appointment } = response.data;

      // 3. CONSTRUCCIÓN DEL MENSAJE USANDO LA RESPUESTA DEL SERVER
      // Usamos el resumen que ya viene formateado desde Python
      const text = `*ORDEN: #${order_id}*\n\n` +
                   `¡Hola! Soy ${formData.customer_name}.\n\n` +
                   `🛍️ *DETALLE:*\n${resumen}\n\n` +
                   `*TOTAL: $${cartTotal}*\n` +
                   `${hasService ? `📅 *CITA:* ${appointment}` : `📍 *ENTREGA:* ${formData.address}`}\n\n` +
                   `📝 *NOTAS:* ${formData.notes || 'Sin notas'}`;

      // 4. REDIRECCIÓN A WHATSAPP
      window.location.href = `https://wa.me/${business_phone}?text=${encodeURIComponent(text)}`;

    } catch (err) {
      console.error(err);
      // Manejo de error específico para falta de saldo (403)
      if (err.response?.status === 403) {
        toast.error("El negocio no puede recibir pedidos en este momento por mantenimiento.");
      } else {
        toast.error(err.response?.data?.detail || "Error al procesar la orden");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 animate-in slide-in-from-right-10 duration-500">
      {/* ... (Cabecera y Lista de Productos se mantienen igual) ... */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep(1)} className="text-xs font-black uppercase text-slate-400 underline underline-offset-4" disabled={isSubmitting}>
          ← Volver
        </button>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Finalizar</h2>
      </div>

      <div className="space-y-3 mb-8">
        {cartArray.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <img src={item.image_url} className="w-16 h-16 rounded-xl object-cover" alt="" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-800 uppercase leading-none">{item.name}</h4>
              <p className="text-orange-600 font-black">${item.price * item.quantity}</p>
            </div>
            {/* Controles de cantidad deshabilitados durante el envío */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
              <button onClick={() => updateQuantity(item.id, -1)} disabled={isSubmitting} className="p-2 text-slate-400"><Minus size={12}/></button>
              <span className="font-black text-xs">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)} disabled={isSubmitting} className="p-2 text-slate-900"><Plus size={12}/></button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tu Nombre</label>
          <input required disabled={isSubmitting} className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 outline-none transition-all disabled:opacity-50" 
            onChange={e => setFormData({...formData, customer_name: e.target.value})} />
        </div>

        {!hasService && (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección</label>
            <input required disabled={isSubmitting} className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 outline-none transition-all" 
              onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
        )}

        {hasService && formData.appointment_datetime && (
          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3">
             <Calendar size={18} className="text-orange-600" />
             <div>
               <p className="text-[10px] font-black uppercase text-orange-600 leading-none">Cita agendada</p>
               <p className="font-bold text-sm text-slate-700">{new Date(formData.appointment_datetime).toLocaleString()}</p>
             </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">¿Alguna nota extra?</label>
          <textarea disabled={isSubmitting} className="w-full bg-slate-50 p-5 rounded-2xl font-medium h-24 outline-none border-2 border-transparent focus:border-slate-900" 
            placeholder="Ej. Tocar el timbre fuerte..." onChange={e => setFormData({...formData, notes: e.target.value})} />
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-center mb-6">
            <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Total a pagar</span>
            <span className="text-3xl font-black italic tracking-tighter">${cartTotal}</span>
          </div>
          
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-slate-400">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageSquare size={18} />}
            {isSubmitting ? "REGISTRANDO..." : "CONFIRMAR PEDIDO"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicCart;