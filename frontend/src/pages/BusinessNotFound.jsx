import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';

const BusinessNotFound = ({ message = "Este negocio no está disponible actualmente." }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* ILUSTRACIÓN / ICONO */}
        <div className="relative flex justify-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10">
            <Store size={48} className="text-slate-300" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full border-4 border-slate-50">
              <AlertCircle size={16} />
            </div>
          </div>
          {/* Decoración de fondo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-slate-200/50 rounded-full blur-3xl" />
        </div>

        {/* TEXTO */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
            Tienda no encontrada
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            {message} <br />
            Es posible que el enlace sea incorrecto o que el negocio haya pausado sus operaciones.
          </p>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            <ArrowLeft size={16} />
            Ir al inicio
          </button>
          
          <a 
            href="https://wa.me/+523153545893" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all text-sm"
          >
            <MessageCircle size={16} />
            Contactar a soporte
          </a>
        </div>

        {/* FOOTER */}
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
          Powered by QuickDrop
        </p>
      </div>
    </div>
  );
};

export default BusinessNotFound;