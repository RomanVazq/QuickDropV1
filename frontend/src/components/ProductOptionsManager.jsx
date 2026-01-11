import React, { useState } from 'react';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';

const ProductOptionsManager = ({ options, setOptions, title, type = 'variant' }) => {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const addOption = () => {
    if (!itemName || !itemPrice) return;
    const newOption = {
      id: Date.now().toString(), // ID temporal para el renderizado
      name: itemName,
      price: parseFloat(itemPrice)
    };
    setOptions([...options, newOption]);
    setItemName('');
    setItemPrice('');
  };

  const removeOption = (id) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  return (
    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        {type === 'variant' ? <Layers size={16} className="text-slate-400" /> : <Tag size={16} className="text-slate-400" />}
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
      </div>

      {/* INPUTS PARA AGREGAR */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nombre"
          className="flex-1 p-3 bg-white rounded-xl text-xs font-bold outline-none border border-transparent focus:border-slate-900"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Precio"
          className="w-24 p-3 bg-white rounded-xl text-xs font-bold outline-none border border-transparent focus:border-slate-900"
          value={itemPrice}
          onChange={(e) => setItemPrice(e.target.value)}
        />
        <button
          type="button"
          onClick={addOption}
          className="bg-slate-900 text-white p-3 rounded-xl hover:bg-orange-500 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* LISTA DE OPCIONES AGREGADAS */}
      <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
        {options.map((opt) => (
          <div key={opt.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
            <div>
              <p className="text-[11px] font-black uppercase text-slate-800">{opt.name}</p>
              <p className="text-[10px] font-bold text-orange-500">+${opt.price}</p>
            </div>
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              className="text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-[10px] text-center text-slate-300 font-bold uppercase py-2 italic">Sin {title.toLowerCase()}</p>
        )}
      </div>
    </div>
  );
};

export default ProductOptionsManager;