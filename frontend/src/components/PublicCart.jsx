import React, { useState } from 'react';
import { Minus, Plus, MessageSquare, Loader2, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom';
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
  business,
  setCart // Prop necesaria para limpiar el estado al finalizar
}) => {
  const { slug } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartArray.length === 0) return toast.error("El carrito está vacío");
    
    setIsSubmitting(true);

    try {
      // 1. ESTRUCTURA DEL PEDIDO
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

      // 2. REGISTRO EN BASE DE DATOS
      const response = await api.post(`/orders/public/place-order/${slug}`, payload);
      const { order_id, resumen, business_phone, appointment } = response.data;

      // 3. LIMPIEZA DE PERSISTENCIA (Crucial para evitar duplicados)
      localStorage.removeItem(`cart_${slug}`);
      localStorage.removeItem(`items_cache_${slug}`);
      if (setCart) setCart({}); 

      // 4. CONSTRUCCIÓN DEL MENSAJE PARA WHATSAPP
      const text = `*ORDEN: #${order_id.substring(0, 8).toUpperCase()}*\n` +
                   `--------------------------\n` +
                   `👤 *Cliente:* ${formData.customer_name}\n` +
                   `🛍️ *Detalle:* \n${resumen}\n\n` +
                   `💰 *TOTAL: $${cartTotal}*\n` +
                   `--------------------------\n` +
                   `${hasService ? `📅 *CITA:* ${appointment}` : `📍 *ENTREGA:* ${formData.address}`}\n` +
                   `📝 *NOTAS:* ${formData.notes || 'Sin notas extra'}\n\n` +
                   `✅ _Pedido enviado desde el catálogo digital_`;

      // 5. REDIRECCIÓN
      toast.success("¡Pedido registrado con éxito!");
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${business_phone}&text=${encodeURIComponent(text)}`;
      
      // Pequeño delay para que el usuario procese el éxito antes de salir de la app
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 800);

    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error("Lo sentimos, el negocio no tiene créditos para recibir pedidos.");
      } else {
        toast.error(err.response?.data?.detail || "Error al procesar la orden");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 animate-in slide-in-from-right-10 duration-500">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => setStep(1)} 
          className="text-xs font-black uppercase text-slate-400 underline underline-offset-4" 
          disabled={isSubmitting}
        >
          ← Volver al catálogo
        </button>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Finalizar</h2>
      </div>

      {/* LISTA DE PRODUCTOS EN EL CARRITO */}
      <div className="space-y-3 mb-8">
        {cartArray.map(item => {
          const yaAlcanzoLimite = item.quantity >= item.stock;

          return (
            <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <img src={item.image_url} className="w-16 h-16 rounded-xl object-cover bg-white" alt={item.name} />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-800 uppercase leading-tight line-clamp-1">{item.name}</h4>
                <p className="text-orange-600 font-black">${item.price * item.quantity}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {item.is_service ? "Servicio" : `En stock: ${item.stock}`}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)} 
                  disabled={isSubmitting} 
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Minus size={12}/>
                </button>
                
                <span className="font-black text-xs min-w-[16px] text-center">{item.quantity}</span>
                
                <button 
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)} 
                  disabled={isSubmitting || yaAlcanzoLimite} 
                  className={`p-2 transition-colors ${
                    yaAlcanzoLimite ? 'text-slate-200' : 'text-slate-900 hover:text-orange-500'
                  }`}
                >
                  <Plus size={12}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FORMULARIO DE CLIENTE */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tú Nombre:</label>
          <input 
            required 
            placeholder="Nombre completo"
            disabled={isSubmitting} 
            className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 outline-none transition-all disabled:opacity-50" 
            value={formData.customer_name}
            onChange={e => setFormData({...formData, customer_name: e.target.value})} 
          />
        </div>

        {!hasService && (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección de entrega</label>
            <input 
              required 
              placeholder="Calle, número, colonia..."
              disabled={isSubmitting} 
              className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 outline-none transition-all" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})} 
            />
          </div>
        )}

        {hasService && formData.appointment_datetime && (
          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3">
             <Calendar size={18} className="text-orange-600" />
             <div>
               <p className="text-[10px] font-black uppercase text-orange-600 leading-none">Cita agendada para:</p>
               <p className="font-bold text-sm text-slate-700">
                 {new Date(formData.appointment_datetime).toLocaleString('es-ES', { 
                   weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
                 })}
               </p>
             </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">¿Alguna nota extra?</label>
          <textarea 
            disabled={isSubmitting} 
            className="w-full bg-slate-50 p-5 rounded-2xl font-medium h-24 outline-none border-2 border-transparent focus:border-slate-900 resize-none" 
            placeholder="EJ: Sin cebolla, llegar después de las 6pm, etc." 
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})} 
          />
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Total del pedido</span>
            <span className="text-3xl font-black italic tracking-tighter text-slate-900">${cartTotal.toFixed(2)}</span>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || cartArray.length === 0}
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <MessageSquare size={18} className="text-orange-500" />
                <span>Confirmar por WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicCart;