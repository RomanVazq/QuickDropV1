import React from 'react';
import { ShieldCheck, Smartphone, ArrowRight, MessageCircle, Check, Coins, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from './img/logo.jpg';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            {/* LOGO OFICIAL */}
            <img
              src={logo}
              alt="QuickDrop Logo"
              className="w-10 h-10  object-cover shadow-lg border border-slate-100 rotate-3"
            />
            <span className="text-2xl font-black tracking-tighter uppercase text-slate-900">
              Quick<span className="text-teal-500">Drop</span>
            </span>
          </div>
        </div>
        <div className="hidden md:flex gap-8 font-bold uppercase text-[10px] tracking-[0.2em] text-slate-500">
          <a href="#features" className="hover:text-teal-500 transition-colors">Características</a>
          <a href="#pricing" className="hover:text-teal-500 transition-colors">Precios</a>
        </div>
        <Link
          to="/login"
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-500 transition-all active:scale-95 shadow-[6px_6px_0px_0px_rgba(79,209,197,0.4)]"
        >
          Entrar
        </Link>
      </nav>

      {/* HERO SECTION */}
      <header className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <span className="inline-block bg-teal-50 text-teal-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-teal-100">
          MENÚ DIGITAL PROFESIONAL ¡ ÚNETE YA !
        </span>
        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase italic mb-8 text-slate-900">
          Vende por <span className="text-teal-500 drop-shadow-sm">WhatsApp</span> <br />
          sin comisiones
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium mb-10 leading-relaxed">
          Catálogo digital inteligente para negocios que no tienen tiempo que perder. <br />
          Recibe pedidos listos para entregar en tu chat.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black uppercase flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-2xl">
            Crear mi catálogo <ArrowRight size={20} className="text-teal-400" />
          </button>
        </div>
      </header>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4">Escoge tu vuelo</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Simple, transparente y justo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* PLAN POR CRÉDITOS */}
            <div className="bg-white border-2 border-slate-200 p-8 rounded-[40px] shadow-[12px_12px_0px_0px_rgba(30,41,59,0.05)] flex flex-col relative group hover:border-teal-500 transition-all">
              <div className="absolute top-6 right-6 text-teal-500">
                <Coins size={32} />
              </div>
              <h3 className="text-3xl font-black uppercase italic mb-2">Emprendedor</h3>
              <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-widest">Ideal para iniciar</p>

              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">$0</span>
                <span className="text-slate-400 font-bold ml-2 italic text-sm">MXN /mes</span>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "1 crédito = 1 pedido recibido",
                  "Recargas desde $50 MXN",
                  "Variantes y Extras ilimitados",
                  "Soporte por chat"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-sm text-slate-600">
                    <Check size={18} className="text-green-500" strokeWidth={3} /> {item}
                  </li>
                ))}
              </ul>

              <button className="w-full bg-slate-50 text-slate-900 border-2 border-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                Cargar Créditos
              </button>
            </div>

            {/* PLAN SUSCRIPCIÓN */}
            <div className="bg-white border-4 border-slate-900 p-8 rounded-[40px] shadow-[12px_12px_0px_0px_rgba(79,209,197,1)] flex flex-col relative transform md:-translate-y-4 transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-slate-900">
                Más popular
              </div>
              <div className="absolute top-6 right-6 text-teal-500">
                <Rocket size={32} />
              </div>
              <h3 className="text-3xl font-black uppercase italic mb-2">PREMIUM</h3>
              <p className="text-teal-600 font-bold text-xs mb-6 uppercase tracking-widest">Negocios con flujo</p>

              <div className="mb-8 text-slate-900">
                <span className="text-5xl font-black">$350</span>
                <span className="font-bold ml-2 italic text-slate-400 text-sm">MXN /mes</span>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Pedidos ilimitados (0 créditos)",
                  "Dashboard de métricas avanzado",
                  "Gestión de stock inteligente",
                  "Soporte Prioritario 24/7"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-sm text-slate-800">
                    <Check size={18} className="text-teal-500" strokeWidth={4} /> {item}
                  </li>
                ))}
              </ul>

              <button className="w-full bg-teal-500 text-slate-900 border-2 border-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-inner transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Suscribirme ahora
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES MINI */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
        {[
          {
            icon: <Smartphone size={32} className="text-orange-500" />,
            title: "Diseño Responsivo",
            desc: "Adapta tu catálogo a cualquier dispositivo con un diseño que se ajusta perfectamente a tu pantalla."
          },
          {
            icon: <MessageCircle size={32} className="text-emerald-500" />,
            title: "Ventas a un Clic",
            desc: "Cero fricción: recibe pedidos listos para cobrar directamente en tu WhatsApp, con todos los detalles y variantes."
          },
          {
            icon: <ShieldCheck size={32} className="text-blue-500" />,
            title: "Control Total 360°",
            desc: "Gestiona tu inventario, analiza tus métricas de éxito y personaliza la identidad de tu marca desde un solo lugar."
          }
        ].map((feat, i) => (
          <div key={i} className="flex flex-col items-center text-center group">
            <div className="bg-teal-50 text-teal-500 p-5 rounded-[2rem] mb-6 group-hover:bg-slate-900 group-hover:text-teal-400 transition-all duration-300">
              {feat.icon}
            </div>
            <h4 className="text-xl font-black uppercase italic mb-2 tracking-tighter">{feat.title}</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-100 text-center bg-white">
        <div className="flex justify-center items-center gap-3 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
          <img src={logo} alt="" className="w-6 h-6 rounded-md object-cover" />
          <span className="text-sm font-black uppercase tracking-tighter">QuickDrop</span>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-300">
          © 2026 SAAS PARA COMERCIO LOCAL, ¡YA!
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;