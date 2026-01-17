import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const ItemDetailModal = ({ isOpen, onClose, item, onAdd }) => {
  if (!isOpen || !item) return null;
  const allImages = [
    item.image_url, 
    ...(item.additional_images || [])
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Contenido del Modal */}
      <div className="relative w-full max-w-[480px] bg-white rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[95vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-900 shadow-lg hover:scale-110 transition-transform"
        >
          <X size={20} strokeWidth={3} />
        </button>

        {/* --- SECCIÓN DE IMAGEN / SLIDER --- */}
        <div className="relative h-[380px] w-full bg-slate-100">
          {allImages.length > 0 ? (
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ clickable: true }}
              navigation={allImages.length > 1}
              className="h-full w-full custom-swiper"
            >
              {allImages.map((url, index) => (
                <SwiperSlide key={index}>
                  <img 
                    src={url} 
                    className="w-full h-full object-cover" 
                    alt={`${item.name} ${index}`} 
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
              <ShoppingBag size={48} opacity={0.2} />
            </div>
          )}
        </div>

        {/* Información */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {item.name}
              </h2>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 italic block">${item.price}</span>
                {item.stock > 0 && (
                   <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase">
                     Stock: {item.stock}
                   </span>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Descripción</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {item.description || "Sin descripción disponible."}
            </p>
          </div>

          {/* Render de Variantes (Si existen) */}
          {item.variants?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Opciones</h3>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <span key={v.id} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                    {v.name} (+${v.price})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Botón de Acción */}
          <button
            onClick={() => {
              onAdd(item.id, 1);
              onClose();
            }}
            className="w-full bg-slate-900 text-white p-5 rounded-[2rem] flex justify-center items-center gap-3 shadow-xl active:scale-[0.98] transition-all hover:bg-black"
          >
            <ShoppingBag size={20} />
            <span className="text-sm font-black uppercase tracking-widest">
              {item.is_service ? 'Agendar este servicio' : 'Añadir al pedido'}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        .custom-swiper .swiper-pagination-bullet { background: #cbd5e1; opacity: 1; }
        .custom-swiper .swiper-pagination-bullet-active { background: #0f172a !important; width: 20px; border-radius: 4px; transition: all 0.3s; }
        .custom-swiper .swiper-button-next, .custom-swiper .swiper-button-prev { 
            color: #0f172a; background: rgba(255,255,255,0.9); width: 40px; height: 40px; border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .custom-swiper .swiper-button-next:after, .custom-swiper .swiper-button-prev:after { font-size: 16px; font-weight: 900; }
        @media (max-width: 640px) { .custom-swiper .swiper-button-next, .custom-swiper .swiper-button-prev { display: none; } }
      `}</style>
    </div>
  );
};

export default ItemDetailModal;