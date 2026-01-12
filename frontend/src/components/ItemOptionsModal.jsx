import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const ItemOptionsModal = ({ isOpen, onClose, item, onConfirm }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // Reiniciar estado cuando cambia el item
  useEffect(() => {
    if (item) {
      setSelectedVariant(item.variants?.length > 0 ? item.variants[0] : null);
      setSelectedExtras([]);
      setQuantity(1);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleExtra = (extra) => {
    setSelectedExtras(prev => 
      prev.find(e => e.id === extra.id) 
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

const isOutOfStock = () => {
  if (item.is_service) return false;

  // Forzamos que tome el stock del item principal
  const currentStock = item.stock;

     // Sin control de stock
  return quantity >= currentStock;
};
  const calculateTotal = () => {
    let base = item.price;
    if (selectedVariant) base = selectedVariant.price;
    const extrasTotal = selectedExtras.reduce((acc, e) => acc + e.price, 0);
    return (base + extrasTotal) * quantity;
  };

  const handleConfirm = () => {
    onConfirm({
      ...item,
      selectedVariant,
      selectedExtras,
      totalPrice: calculateTotal() / quantity, // Precio unitario con opciones
      cartQuantity: quantity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 pb-0 flex justify-between items-start">
          <div className="flex gap-4">
            <img src={item.image_url} className="w-20 h-20 rounded-3xl object-cover shadow-sm" alt="" />
            <div>
              <h3 className="text-xl font-black italic uppercase leading-tight">{item.name}</h3>
              <p className="text-slate-400 text-xs font-bold line-clamp-2 mt-1">{item.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* VARIANTES (Ej: Tamaños) */}
          {item.variants?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona una opción</p>
              <div className="grid grid-cols-1 gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${
                      selectedVariant?.id === v.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm uppercase">{v.name}</span>
                    <span className="font-black text-sm">${v.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXTRAS (Ej: Ingredientes extra) */}
          {item.extras?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agrega complementos</p>
              <div className="space-y-2">
                {item.extras.map((e) => {
                  const isSelected = selectedExtras.find(ex => ex.id === e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleExtra(e)}
                      className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${
                        isSelected ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200'}`}>
                          {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className="font-bold text-sm uppercase">{e.name}</span>
                      </div>
                      <span className="font-black text-sm text-orange-500">+${e.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CANTIDAD */}
          {!item.is_service && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-slate-400">Cantidad</p>
              <div className="flex items-center gap-6">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 bg-white rounded-xl shadow-sm"><Minus size={18}/></button>
                <span className="text-lg font-black italic">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 bg-white rounded-xl shadow-sm" disabled={isOutOfStock()}><Plus size={18}/></button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACCIÓN */}
        <div className="p-6 bg-white border-t border-slate-100">
          <button 
            onClick={handleConfirm}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex justify-between px-8 items-center hover:bg-orange-500 transition-all"
          >
            <span>Agregar</span>
            <span className="text-xl italic">${calculateTotal()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemOptionsModal;