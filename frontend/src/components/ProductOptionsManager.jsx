import React, { useState } from 'react';
import { Layers, Tag, Plus, X, Check, Edit2 } from 'lucide-react';

const ProductOptionsManager = ({ options, setOptions, title, type = 'variant' }) => {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemStock, setItemStock] = useState('');
  
  // Estado para controlar qué elemento estamos editando
  const [editingId, setEditingId] = useState(null);

  const addOption = () => {
    if (!itemName || itemPrice === '' || itemStock === '') return;
    const newOption = {
      id: `temp-${Date.now()}`,
      name: itemName,
      price: parseFloat(itemPrice),
      stock: parseInt(itemStock)
    };
    setOptions([...options, newOption]);
    setItemName(''); setItemPrice(''); setItemStock('');
  };

  const updateOption = (id, field, value) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  return (
    <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 space-y-3">
      <div className="flex items-center gap-2">
        {type === 'variant' ? <Layers size={14} className="text-slate-400" /> : <Tag size={14} className="text-slate-400" />}
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
      </div>

      {/* Input de nueva opción */}
      <div className="flex gap-1.5 items-center h-10">
        <input type="text" placeholder="Nombre" className="flex-[2] min-w-0 h-full px-3 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none focus:border-slate-900" value={itemName} onChange={e => setItemName(e.target.value)} />
        <input type="number" placeholder="$" className="w-16 h-full px-2 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
        <input type="number" placeholder="STK" className="w-16 h-full px-2 bg-teal-50 text-teal-700 rounded-xl text-xs font-bold border border-teal-100 outline-none" value={itemStock} onChange={e => setItemStock(e.target.value)} />
        <button type="button" onClick={addOption} className="h-full px-3 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-all">
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Lista de Opciones (Badges / Inputs de edición) */}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <div key={opt.id} className="animate-in fade-in slide-in-from-left-2">
            {editingId === opt.id ? (
              /* MODO EDICIÓN */
              <div className="flex gap-1.5 items-center bg-white p-1.5 rounded-2xl border border-slate-900 shadow-sm">
                <input 
                  type="text" 
                  className="flex-[2] min-w-0 px-2 py-1 text-xs font-bold bg-slate-50 rounded-lg outline-none" 
                  value={opt.name} 
                  onChange={e => updateOption(opt.id, 'name', e.target.value)} 
                />
                <input 
                  type="number" 
                  className="w-14 px-1 py-1 text-xs font-bold bg-slate-50 rounded-lg outline-none" 
                  value={opt.price} 
                  onChange={e => updateOption(opt.id, 'price', parseFloat(e.target.value))} 
                />
                <input 
                  type="number" 
                  className="w-14 px-1 py-1 text-xs font-bold bg-teal-50 text-teal-700 rounded-lg outline-none" 
                  value={opt.stock} 
                  onChange={e => updateOption(opt.id, 'stock', parseInt(e.target.value))} 
                />
                <button 
                  onClick={() => setEditingId(null)} 
                  className="p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                >
                  <Check size={14} strokeWidth={3} />
                </button>
              </div>
            ) : (
              /* MODO VISTA (BADGE) */
              <div className="group flex items-center justify-between gap-2 pl-3 pr-2 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-700 uppercase">{opt.name}</span>
                  <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                    ${opt.price} • {opt.stock} ud
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingId(opt.id)} 
                    className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                  >
                    <Edit2 size={12} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => setOptions(options.filter(o => o.id !== opt.id))} 
                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { ProductOptionsManager };