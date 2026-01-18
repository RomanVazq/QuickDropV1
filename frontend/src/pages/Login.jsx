import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, Mail, Loader2, ArrowRight, Zap, ChevronLeft } from 'lucide-react';
import logo from '../assets/logo.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);

      toast.success("¡Acceso concedido!");

      if (res.data.is_superuser) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error("Credenciales incorrectas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans text-slate-900 overflow-hidden relative">

      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-50 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[100px] opacity-80" />
      </div>

      <div className="max-w-md w-full relative">
        <Link to="/" className="absolute -top-16 left-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-500 transition-colors group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver al inicio
        </Link>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src={logo}
              alt="QuickDrop"
              className="w-12 h-12 object-cover shadow-xl border border-slate-100 rotate-3 rounded-xl"
            />
            <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">
              Quick<span className="text-teal-500">Drop</span>
            </h1>
          </div>
          <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
            Panel de Control
          </div>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="bg-white p-8 md:p-10 rounded-[40px] border-2 border-slate-900 shadow-[12px_12px_0px_0px_rgba(90,209,197,1)] animate-in slide-in-from-bottom-8 duration-500">
          <form onSubmit={handleLogin} className="space-y-6">

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Email de Negocio</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-5 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
                <input
                  required
                  type="email"
                  placeholder="ejemplo@negocio.com"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white p-5 pl-14 rounded-[24px] font-bold outline-none transition-all"
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contraseña</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-5 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white p-5 pl-14 rounded-[24px] font-bold outline-none transition-all"
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-teal-500 transition-all flex items-center justify-center gap-3 active:scale-[0.97]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Entrar al sistema
                  <ArrowRight size={18} className="text-teal-400" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            ¿Aún no tienes QuickDrop?
          </p>
          <button onClick={() => {
            const telefono = "523153545893";
            const mensaje = encodeURIComponent("¡Hola! Me interesa digitalizar mi negocio con QuickDrop. ¿Me podrían dar más información?");
            window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
          }} className="mt-2 text-slate-900 font-black uppercase text-[11px] tracking-tighter border-b-2 border-teal-500 pb-1 hover:text-teal-500 transition-colors">
            Digitaliza tu negocio ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;