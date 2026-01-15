import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Camera, Palette, Save, ArrowLeft, Settings } from 'lucide-react';
import { AccountSettings } from '../components/dashboard/accountSettings';

export const ConfigBusiness = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [config, setConfig] = useState({
    primary_color: '#ffffff',
    secundary_color: '#000000',
    logo_url: '',
    slug: '',
    phone: '',
  });
  const [name, setName] = useState('');
  const [view, setView] = useState('appearance'); // 'appearance' o 'settings'

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get('/business/me');
        setConfig({
          primary_color: data.primary_color || '#ffffff',
          secundary_color: data.secundary_color || '#000000',
          logo_url: data.logo_url || '',
          slug: data.slug || '',
          phone: data.phone || '',
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
    <div className="max-w-2xl mx-auto">
      {/* Selector de Vista Superior */}
      <div className="flex justify-between items-center mb-6 px-4">
        <button 
          onClick={() => setView(view === 'appearance' ? 'settings' : 'appearance')}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all bg-slate-100 px-4 py-2 rounded-full"
        >
          {view === 'appearance' ? (
            <><Settings size={14} /> Configurar Cuenta y Horarios</>
          ) : (
            <><ArrowLeft size={14} /> Volver a Personalización</>
          )}
        </button>
      </div>

      {view === 'settings' ? (
        <AccountSettings data={{ business: { ...config, name } }} />
      ) : (
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Diseño del Menú</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Colores e identidad visual</p>
            </div>
          </div>

          <div className="space-y-10">
            {/* PREVIEW */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vista Previa en Vivo</label>
              <div className="relative h-52 rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                <div className="absolute inset-0">
                  {(preview || config.logo_url) && (
                    <img src={preview || config.logo_url} className="w-full h-full object-cover opacity-30 blur-[1px]" alt="fondo" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" 
                     style={{ color: config.primary_color, WebkitTextStroke: `1px ${config.secundary_color}`, paintOrder: 'stroke fill' }}>
                    Bienvenido a
                  </p>
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none"
                    style={{ 
                      color: config.primary_color, 
                      WebkitTextStroke: `1.8px ${config.secundary_color}`, 
                      paintOrder: 'stroke fill',
                      filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.05))'
                    }}>
                    {name || "Tu Negocio"}
                  </h1>
                </div>
              </div>
            </div>

            {/* CONTROLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  <Camera size={12} /> Banner / Logo
                </label>
                <input type="file" id="logo" className="hidden" onChange={handleFileChange} accept="image/*" />
                <label htmlFor="logo" className="flex flex-col items-center justify-center gap-2 w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-white hover:border-slate-900 transition-all group shadow-sm">
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    <Camera size={16} className="text-slate-400 group-hover:text-slate-900" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-900 tracking-tighter">
                    {file ? "Archivo cargado" : "Cambiar imagen"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Letras</label>
                  <input type="color" value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-full h-24 rounded-[2rem] cursor-pointer border-8 border-slate-50 bg-slate-50"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Contorno</label>
                  <input type="color" value={config.secundary_color}
                    onChange={(e) => setConfig({ ...config, secundary_color: e.target.value })}
                    className="w-full h-24 rounded-[2rem] cursor-pointer border-8 border-slate-50 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <button onClick={handleUpdate} disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Guardar Estilo Visual"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};