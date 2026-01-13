import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, Ban } from 'lucide-react';

const ItemOptionsModal = ({ isOpen, onClose, item, cart, onConfirm }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // --- LÓGICA DE CÁLCULO DE STOCK REAL (Stock Base - Cantidad en Carrito) ---
  const getEffectiveStock = (variant = selectedVariant) => {
    if (!item) return 0;
    if (item.is_service) return 999;

    // 1. Obtener el stock total que viene de la base de datos/estado
    const totalBaseStock = item.stock || 0;
    
    // 2. Calcular cuánto de este producto YA está en el carrito
    // Filtramos las llaves del carrito que pertenecen a este item ID
    const quantityInCart = Object.keys(cart || {}).reduce((acc, key) => {
      if (key.startsWith(`${item.id}_`)) {
        // Si estamos evaluando una variante específica, solo sumamos lo que coincida con esa variante
        if (variant) {
          if (key.includes(`_v${variant.id}_`)) return acc + cart[key];
        } else {
          // Si no hay variantes, sumamos todo lo que pertenezca a este ID
          return acc + cart[key];
        }
      }
      return acc;
    }, 0);

    // 3. El stock disponible es el total menos lo que ya reservamos en el carrito
    const availableBase = totalBaseStock - quantityInCart;

    if (variant) {
      // Si hay variante, el límite es el mínimo entre lo que queda del total y lo que queda de la variante
      const availableVariant = (variant.stock || 0) - quantityInCart;
      return Math.max(0, Math.min(availableBase, availableVariant));
    }

    return Math.max(0, availableBase);
  };

  useEffect(() => {
    if (item && isOpen) {
      // Al abrir, buscamos la primera variante que aún tenga stock real disponible
      const firstAvailable = item.variants?.find(v => getEffectiveStock(v) > 0);
      setSelectedVariant(firstAvailable || (item.variants?.length > 0 ? item.variants[0] : null));
      setSelectedExtras([]);
      setQuantity(1);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const currentAvailableStock = getEffectiveStock();
  const isLimitReached = () => quantity >= currentAvailableStock;
  const isBaseItemOut = getEffectiveStock(null) <= 0 && !item.is_service;

  const toggleExtra = (extra) => {
    if (extra.stock <= 0 || isBaseItemOut) return;
    setSelectedExtras(prev => 
      prev.find(e => e.id === extra.id) 
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const calculateTotal = () => {
    let unitPrice = selectedVariant ? selectedVariant.price : item.price;
    const extrasTotal = selectedExtras.reduce((acc, e) => acc + e.price, 0);
    return (unitPrice + extrasTotal) * quantity;
  };

  const handleConfirm = () => {
    if (currentAvailableStock <= 0 || quantity > currentAvailableStock) return;
    
    onConfirm({
      ...item,
      selectedVariant,
      selectedExtras,
      totalPrice: calculateTotal() / quantity,
      cartQuantity: quantity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-start">
          <div className="flex gap-4">
            <img src={item.image_url} className="w-20 h-20 rounded-3xl object-cover shadow-sm" alt="" />
            <div>
              <h3 className="text-xl font-black italic uppercase leading-tight">{item.name}</h3>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className={`text-[10px] font-bold uppercase ${isBaseItemOut ? 'text-red-500' : 'text-slate-400'}`}>
                  {isBaseItemOut ? 'Sin existencias disponibles' : `Disponibles ahora: ${currentAvailableStock}`}
                </p>
                {selectedVariant && !isBaseItemOut && (
                  <p className="text-[9px] font-black text-teal-600 uppercase">
                    Límite de esta opción: {getEffectiveStock(selectedVariant)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* VARIANTES */}
          {item.variants?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona Opción</p>
              <div className="grid grid-cols-1 gap-2">
                {item.variants.map((v) => {
                  const vStock = getEffectiveStock(v);
                  const isVout = vStock <= 0 || isBaseItemOut;
                  const isSelected = selectedVariant?.id === v.id;
                  
                  return (
                    <button
                      key={v.id}
                      disabled={isVout}
                      onClick={() => {
                        setSelectedVariant(v);
                        if(quantity > vStock) setQuantity(vStock || 1);
                      }}
                      className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${
                        isVout 
                          ? 'border-slate-50 bg-slate-50 opacity-50 cursor-not-allowed' 
                          : isSelected 
                            ? 'border-slate-900 bg-slate-900 text-white' 
                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-sm uppercase flex items-center gap-2">
                          {v.name} {isVout && <Ban size={12} className="text-red-500" />}
                        </p>
                        <p className="text-[9px] font-bold uppercase opacity-60">
                          {isVout ? 'Agotado' : `Quedan ${vStock}`}
                        </p>
                      </div>
                      <span className="font-black text-sm">${v.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXTRAS */}
          {item.extras?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extras</p>
              <div className="grid grid-cols-1 gap-2">
                {item.extras.map((e) => {
                  const isSelected = selectedExtras.find(ex => ex.id === e.id);
                  const isEout = e.stock <= 0 || isBaseItemOut;
                  return (
                    <button
                      key={e.id}
                      disabled={isEout}
                      onClick={() => toggleExtra(e)}
                      className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${
                        isEout
                          ? 'border-slate-50 bg-slate-50 opacity-40 cursor-not-allowed'
                          : isSelected 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isEout ? 'bg-slate-200 border-slate-300' : isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={4} />}
                          {isEout && <Ban size={10} className="text-slate-400" />}
                        </div>
                        <span className="font-bold text-sm uppercase">{e.name}</span>
                      </div>
                      <span className={`font-black text-sm ${isEout ? 'text-slate-300' : 'text-orange-500'}`}>
                        +${e.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTADOR */}
          {!item.is_service && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Cantidad</p>
                {isLimitReached() && <p className="text-[9px] text-orange-600 font-bold uppercase italic">Máximo alcanzado</p>}
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="p-2 bg-white rounded-xl shadow-sm text-slate-900 active:scale-90 transition-transform"
                >
                  <Minus size={18}/>
                </button>
                <span className="text-xl font-black italic w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)} 
                  disabled={isLimitReached() || currentAvailableStock <= 0}
                  className={`p-2 bg-white rounded-xl shadow-sm active:scale-90 transition-transform ${isLimitReached() ? 'opacity-30' : 'text-slate-900'}`}
                >
                  <Plus size={18}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-white border-t border-slate-100">
          <button 
            onClick={handleConfirm}
            disabled={currentAvailableStock <= 0}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest flex justify-between px-8 items-center transition-all ${
              currentAvailableStock <= 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
            }`}
          >
            <span>
              {isBaseItemOut ? 'Sin Stock' : currentAvailableStock <= 0 ? 'Opción Agotada' : 'Añadir a la orden'}
            </span>
            <span className="text-xl italic">${currentAvailableStock <= 0 ? 0 : calculateTotal()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemOptionsModal;