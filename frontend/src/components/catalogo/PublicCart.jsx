import React, { useState, useMemo } from 'react';
import { Minus, Plus, MessageSquare, Loader2, Tag, Layers, Truck, Store, MapPin, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
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
  
  // Forzamos selección inicial en null a menos que sea un servicio (que siempre es local)
  const [deliveryType, setDeliveryType] = useState(hasService ? 'pickup' : null);

  // Cálculo de total dinámico
  const finalTotal = useMemo(() => {
    const shippingPrice = (deliveryType === 'delivery' && business?.has_delivery) 
      ? (business.delivery_price || 0) 
      : 0;
    return cartTotal + shippingPrice;
  }, [cartTotal, deliveryType, business]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryType) return toast.error("Por favor selecciona un método de entrega");
    if (cartArray.length === 0) return toast.error("El carrito está vacío");

    if (!hasService && deliveryType === 'delivery' && (!formData.address || formData.address.length < 5)) {
      return toast.error("Ingresa una dirección de envío válida");
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: formData.customer_name,
        address: deliveryType === 'delivery' ? formData.address : "RECOGER EN LOCAL",
        appointment_datetime: formData.appointment_datetime || null,
        notes: formData.notes || "",
        delivery_type: deliveryType,
        items: cartArray.map(item => ({
          product_id: item.originalId || item.id,
          quantity: item.quantity,
          variant_name: item.selectedVariant?.name || item.variant_name || null,
          extras_names: item.selectedExtras?.map(e => e.name).join(", ") || item.extras_names || null
        }))
      };

      const response = await api.post(`/orders/public/place-order/${slug}`, payload);
      const { order_id, resumen, business_phone, appointment_datetime } = response.data;

      let formattedAppointment = null;
      if (appointment_datetime) {
        const date = new Date(appointment_datetime);
        formattedAppointment = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }

      localStorage.removeItem(`cart_${slug}`);
      if (setCart) setCart({}); 

      const deliveryEmoji = deliveryType === 'delivery' ? '🏠' : '🏬';
      const deliveryText = deliveryType === 'delivery' ? `*ENVÍO:* ${formData.address}` : `*RECOGER EN LOCAL*`;

      const whatsappMsg = `*ORDEN: #${order_id.substring(0, 8).toUpperCase()}*\n` +
                          `--------------------------\n` +
                          `👤 *Cliente:* ${formData.customer_name}\n` +
                          `🛍️ *Detalle:* \n${resumen}\n\n` +
                          `💰 *TOTAL FINAL: $${finalTotal.toFixed(2)}*\n` +
                          `--------------------------\n` +
                          `${hasService && formattedAppointment ? `📅 *CITA:* ${formattedAppointment}` : !hasService ? `${deliveryEmoji} ${deliveryText}` : ''}\n` +
                          `📝 *NOTAS:* ${formData.notes || 'Sin notas'}\n\n` +
                          `✅ _Pedido enviado desde QuickDrop_`;

      toast.success("¡Pedido enviado!");
      setTimeout(() => {
        window.location.href = `https://api.whatsapp.com/send?phone=${business_phone}&text=${encodeURIComponent(whatsappMsg)}`;
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al procesar la orden");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 animate-in slide-in-from-right-10 duration-500 max-w-2xl mx-auto pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep(1)} className="text-xs font-black uppercase text-slate-400 underline underline-offset-4 hover:text-slate-600 transition-colors">
          ← Volver al catálogo
        </button>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Resumen</h2>
      </div>

      {/* Lista de Items */}
      <div className="space-y-3 mb-8">
        {cartArray.map(item => {
          // Lógica de stock para el botón Plus
          const availableStock = item.selectedVariant ? item.selectedVariant.stock : item.stock;
          const isLimitReached = !item.is_service && item.quantity >= availableStock;

          return (
            <div key={item.cartKey || item.id} className="flex flex-col gap-2 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover bg-white border border-slate-200" alt={item.name} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-800 uppercase leading-tight line-clamp-1">{item.name}</h4>
                  
                  {/* Variantes y Extras */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(item.selectedVariant || item.variant_name) && (
                      <span className="flex items-center gap-1 text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase">
                        <Layers size={8}/> {item.selectedVariant?.name || item.variant_name}
                      </span>
                    )}
                    {(item.selectedExtras || item.extras_names) && (
                      <span className="flex items-center gap-1 text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase">
                        <Tag size={8}/> {item.selectedExtras?.map(e => e.name).join(", ") || item.extras_names}
                      </span>
                    )}
                  </div>
                  <p className="text-orange-600 font-black mt-1 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                
                {/* Control de Cantidad con Validación de Stock Real */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                  <button type="button" onClick={() => updateQuantity(item.cartKey || item.id, -1)} disabled={isSubmitting} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Minus size={12}/>
                  </button>
                  <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                  <button 
                    type="button" 
                    onClick={() => updateQuantity(item.cartKey || item.id, 1)} 
                    disabled={isSubmitting || isLimitReached} 
                    className={`p-2 transition-colors ${isLimitReached ? 'text-slate-200 cursor-not-allowed' : 'text-slate-900 hover:text-orange-500'}`}
                  >
                    <Plus size={12}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Entrega Obligatorio */}
        {!hasService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Método de entrega</label>
                {!deliveryType && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-500 animate-pulse">
                        <AlertCircle size={10}/> SELECCIÓN REQUERIDA
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setDeliveryType('pickup')}
                className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${deliveryType === 'pickup' ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 opacity-60 hover:opacity-100'}`}
              >
                <Store size={22} />
                <span className="text-[11px] font-black uppercase">Recoger en local</span>
              </button>
              
              {business?.has_delivery && (
                <button 
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${deliveryType === 'delivery' ? 'border-teal-500 bg-teal-500 text-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 opacity-60 hover:opacity-100'}`}
                >
                  <Truck size={22} />
                  <span className="text-[11px] font-black uppercase">A domicilio</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Datos de Envío */}
        <div className={`space-y-4 bg-slate-50 p-6 rounded-[32px] border border-slate-100 transition-all duration-500 ${!deliveryType && !hasService ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre de quién recibe</label>
            <input required placeholder="Tu nombre" className="w-full bg-white p-5 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 outline-none transition-all" 
              value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} 
            />
          </div>

          {deliveryType === 'delivery' && (
            <div className="space-y-1 animate-in slide-in-from-top-4">
              <label className="text-[10px] font-black uppercase text-teal-600 ml-2">Dirección de entrega</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-5 top-5 text-teal-500" />
                <input required placeholder="Calle, número, colonia..." className="w-full bg-white p-5 pl-12 rounded-2xl font-bold border-2 border-teal-100 focus:border-teal-500 outline-none transition-all shadow-sm" 
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Notas adicionales</label>
            <textarea className="w-full bg-white p-5 rounded-2xl font-medium h-24 outline-none border-2 border-transparent focus:border-slate-900 resize-none transition-all" 
              placeholder="Ej. Casa de portón blanco, sin cebolla..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} 
            />
          </div>
        </div>

        {/* Resumen de Costos */}
        <div className="pt-4 border-t border-slate-100">
          <div className="space-y-2 mb-8 px-4">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-black text-[10px] uppercase tracking-widest">Subtotal</span>
              <span className="text-lg font-black italic tracking-tighter">${cartTotal.toFixed(2)}</span>
            </div>
            {(deliveryType === 'delivery' && business?.has_delivery) && (
              <div className="flex justify-between items-center text-teal-600">
                <span className="font-black text-[10px] uppercase tracking-widest">Envío a domicilio</span>
                <span className="text-lg font-black italic tracking-tighter">+ ${business?.delivery_price.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-dashed border-slate-200">
              <span className="font-black text-slate-900 text-xs uppercase tracking-widest leading-none">Total a Pagar</span>
              <span className="text-4xl font-black italic tracking-tighter text-slate-900">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || cartArray.length === 0 || (!deliveryType && !hasService)}
            className={`w-full py-7 rounded-[32px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${!deliveryType && !hasService ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : deliveryType === 'delivery' ? 'bg-teal-500 text-white' : 'bg-slate-900 text-white'}`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <MessageSquare size={20} className={deliveryType === 'delivery' ? 'text-teal-200' : 'text-orange-500'} />
                <span>{deliveryType ? 'Confirmar Pedido' : 'Elige Entrega'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicCart;