import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Camera, Palette, Type, Save } from 'lucide-react';

export const ConfigBusiness = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [config, setConfig] = useState({
    primary_color: '#ffffff',
    secundary_color: '#000000',
    logo_url: '',
  });
  const [name, setName] = useState('');

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
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('primary_color', config.primary_color);
      formData.append('secundary_color', config.secundary_color);
      if (file) formData.append('file', file);

      const { data } = await api.patch('/business/config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Apariencia actualizada");
      setConfig(prev => ({ ...prev, logo_url: data.logo_url }));
      setPreview(null);
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 max-w-xl mx-auto shadow-xl shadow-slate-200/50 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-900 rounded-2xl text-white">
          <Palette size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Personalización</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Estilo visual del negocio</p>
        </div>
      </div>

      <div className="space-y-10">

        {/* VISTA PREVIA MEJORADA (ESTILO HEADER) */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preview</label>
          <div className="relative h-48 rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 group">
            {/* Imagen de fondo */}
            <div className="absolute inset-0 bg-slate-200">
              {(preview || config.logo_url) && (
                <img src={preview || config.logo_url} className="w-full h-full object-cover opacity-40 blur-[2px]" alt="fondo" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>

            {/* Texto con el estilo que configuramos */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1"                 style={{
                  color: config.primary_color,
                  WebkitTextStroke: `1.5px ${config.secundary_color}`,
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))'
                }}>Bienvenido a</p>
              <h1
                className="text-4xl font-black uppercase tracking-tighter italic leading-none"
                style={{
                  color: config.primary_color,
                  WebkitTextStroke: `1.5px ${config.secundary_color}`,
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))'
                }}
              >
                {name || "Tu Negocio"}
              </h1>
            </div>
          </div>
        </div>

        {/* CONTROLES ORGANIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              <Camera size={12} /> Logo / Imagen
            </label>
            <input type="file" id="logo" className="hidden" onChange={handleFileChange} accept="image/*" />
            <label htmlFor="logo" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-slate-900 transition-all group">
              <span className="text-xs font-black uppercase text-slate-500 group-hover:text-slate-900">
                {file ? "Imagen Lista" : "Seleccionar"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Letras
              </label>
              <div className="relative">
                <input
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  className="w-full h-14 rounded-2xl cursor-pointer border-none bg-slate-50 p-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Contorno
              </label>
              <input
                type="color"
                value={config.secundary_color}
                onChange={(e) => setConfig({ ...config, secundary_color: e.target.value })}
                className="w-full h-14 rounded-2xl cursor-pointer border-none bg-slate-50 p-1"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="group relative w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-slate-200 active:scale-95 transition-all overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save size={16} /> Guardar Cambios</>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};