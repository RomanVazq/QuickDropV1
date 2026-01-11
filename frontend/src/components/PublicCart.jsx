import React, { useState } from 'react';
import { Minus, Plus, MessageSquare, Loader2, Calendar, Tag, Layers } from 'lucide-react';
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
  setCart 
}) => {
  const { slug } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartArray.length === 0) return toast.error("El carrito está vacío");
    
    setIsSubmitting(true);

    try {
      // 1. ESTRUCTURA DEL PEDIDO ACTUALIZADA
      const payload = {
        customer_name: formData.customer_name,
        address: hasService ? "SERVICIO EN LOCAL" : formData.address,
        appointment_datetime: formData.appointment_datetime || null,
        notes: formData.notes || "",
        items: cartArray.map(item => ({
          product_id: item.originalId || item.id, // Usamos el ID original para la DB
          quantity: item.quantity,
          // Enviamos los detalles de personalización para que el backend los guarde en la orden
          variant_name: item.selectedVariant?.name || null,
          extras_names: item.selectedExtras?.map(e => e.name).join(", ") || null
        }))
      };

      const response = await api.post(`/orders/public/place-order/${slug}`, payload);
      const { order_id, resumen, business_phone, appointment } = response.data;

      localStorage.removeItem(`cart_${slug}`);
      localStorage.removeItem(`items_cache_${slug}`);
      if (setCart) setCart({}); 

      // 4. MENSAJE PARA WHATSAPP (Incluyendo Variantes y Extras)
      const text = `*ORDEN: #${order_id.substring(0, 8).toUpperCase()}*\n` +
                   `--------------------------\n` +
                   `👤 *Cliente:* ${formData.customer_name}\n` +
                   `🛍️ *Detalle:* \n${resumen}\n\n` +
                   `💰 *TOTAL: $${cartTotal.toFixed(2)}*\n` +
                   `--------------------------\n` +
                   `${hasService ? `📅 *CITA:* ${appointment}` : `📍 *ENTREGA:* ${formData.address}`}\n` +
                   `📝 *NOTAS:* ${formData.notes || 'Sin notas extra'}\n\n` +
                   `✅ _Pedido enviado desde el catálogo digital_`;

      toast.success("¡Pedido registrado con éxito!");
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${business_phone}&text=${encodeURIComponent(text)}`;
      
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 800);

    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error("Lo sentimos, el negocio no tiene créditos.");
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

      <div className="space-y-3 mb-8">
        {cartArray.map(item => {
          const yaAlcanzoLimite = item.quantity >= item.stock;

          return (
            <div key={item.cartKey || item.id} className="flex flex-col gap-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm" alt={item.name} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-800 uppercase leading-tight line-clamp-1">{item.name}</h4>
                  
                  {/* VISUALIZACIÓN DE VARIANTES Y EXTRAS */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.selectedVariant && (
                      <span className="flex items-center gap-1 text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase">
                        <Layers size={8}/> {item.selectedVariant.name}
                      </span>
                    )}
                    {item.selectedExtras?.map(extra => (
                      <span key={extra.id} className="flex items-center gap-1 text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase">
                        <Tag size={8}/> {extra.name}
                      </span>
                    ))}
                  </div>

                  <p className="text-orange-600 font-black mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button 
                    type="button"
                    onClick={() => updateQuantity(item.cartKey || item.id, -1)} 
                    disabled={isSubmitting} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Minus size={12}/>
                  </button>
                  <span className="font-black text-xs min-w-[16px] text-center">{item.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => updateQuantity(item.cartKey || item.id, 1)} 
                    disabled={isSubmitting || yaAlcanzoLimite || item.isCustom} // Desactivado si es custom para evitar líos de precio
                    className={`p-2 transition-colors ${
                      yaAlcanzoLimite || item.isCustom ? 'text-slate-200' : 'text-slate-900 hover:text-orange-500'
                    }`}
                  >
                    <Plus size={12}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ... (Resto del formulario igual al original) ... */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tu Nombre:</label>
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
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={20} /><span>Procesando...</span></>
            ) : (
              <><MessageSquare size={18} className="text-orange-500" /><span>Confirmar por WhatsApp</span></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicCart;