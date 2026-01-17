import React from 'react';
import { X, Zap, Package, ShoppingBag } from 'lucide-react';

const ItemDetailModal = ({ isOpen, onClose, item, onAdd }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Contenido del Modal */}
      <div className="relative w-full max-w-[480px] bg-white rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-900 shadow-lg"
        >
          <X size={20} strokeWidth={3} />
        </button>

        {/* Imagen Principal */}
        <div className="relative h-[350px] w-full bg-slate-100">
          <img 
            src={item.image_url  } 
            className="w-full h-full object-cover"
            alt={item.name}
          />
        </div>

        {/* Información */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {item.name}
              </h2>
              <span className="text-2xl font-black text-slate-900 italic">${item.price}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Descripción</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {item.description || "Este producto ha sido seleccionado cuidadosamente bajo los más altos estándares de calidad. Disfruta de una experiencia única con nuestro servicio exclusivo."}
            </p>
          </div>

          {/* Botón de Acción */}
          <button
            onClick={() => {
              onAdd(item.id, 1);
              onClose();
            }}
            className="w-full bg-slate-900 text-white p-5 rounded-[2rem] flex justify-center items-center gap-3 shadow-xl active:scale-[0.98] transition-all"
          >
            <ShoppingBag size={20} />
            <span className="text-sm font-black uppercase tracking-widest">
              {item.is_service ? 'Agendar este servicio' : 'Añadir al pedido'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;