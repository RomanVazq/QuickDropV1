import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const ConfigBusiness = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [config, setConfig] = useState({
    primary_color: '#ffffff',
    logo_url: '',
    secundary_color: '#000000',
  });
  const [name, setName] = useState('');

  // Cargar datos actuales
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get('/business/me');
        setConfig({
          primary_color: data.primary_color || '#ffffff',
          secundary_color: data.secundary_color || '#000000',
          logo_url: data.logo_url || '',
        });
        setName(data.name || '');
      } catch (err) { console.error(err); }
    };
    loadData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile)); // Vista previa local
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('primary_color', config.primary_color);
      formData.append('secundary_color', config.secundary_color);
      if (file) {
        formData.append('file', file);
      }

      const { data } = await api.patch('/business/config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Apariencia actualizada");
      setConfig(prev => ({ ...prev, logo_url: data.logo_url }));
      setPreview(null); // Limpiar vista previa temporal
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md mx-auto">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-6">Apariencia del Header</h2>
      
      <div className="space-y-8">
        
        {/* VISTA PREVIA DEL HEADER COMPLETO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase">Vista Previa</label>
          <div 
            className="rounded-2xl p-4 flex items-center gap-3 transition-colors duration-300"
            style={{ backgroundColor: config.primary_color }}
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0">
               {preview || config.logo_url ? (
                 <img src={preview || config.logo_url} className="w-full h-full object-cover" />
               ) : <span className="font-bold">{name.charAt(0)}</span>}
               
            </div>
            <span className='text-xl font-black text-slate-900 uppercase tracking-tighter' style={{color: config.secundary_color}}>{name}</span>
            
          </div>
        </div>

        {/* CONTROLES */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
             <label className="block text-[10px] font-black text-slate-400 uppercase">Imagen</label>
             <input type="file" id="logo" className="hidden" onChange={handleFileChange} accept="image/*" />
             <label htmlFor="logo" className="block text-center text-[10px] font-bold bg-slate-100 py-3 rounded-xl cursor-pointer">
               {file ? "Cambiada" : "Subir Logo"}
             </label>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase">Color Fondo</label>
            <input 
              type="color" 
              value={config.primary_color}
              onChange={(e) => setConfig({...config, primary_color: e.target.value})}
              className="w-full h-10 rounded-xl cursor-pointer border-none bg-slate-50"
            />
          </div>
        <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase">Color del Texto</label>
            <input 
              type="color" 
              value={config.secundary_color}
              onChange={(e) => setConfig({...config, secundary_color: e.target.value})}
              className="w-full h-10 rounded-xl cursor-pointer border-none bg-slate-50"
            />
          </div>
        </div>
        

        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest"
        >
          {loading ? 'Guardando...' : 'Guardar y Publicar'}
        </button>
      </div>
    </div>
  );
};
