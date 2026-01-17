import React from 'react';
import { ShieldCheck, Smartphone, ArrowRight, MessageCircle, Check, Coins, Rocket, ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from './img/logo.jpg';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="QuickDrop Logo"
              className="w-10 h-10 object-cover shadow-lg border border-slate-100 rotate-3"
            />
            <span className="text-2xl font-black tracking-tighter uppercase text-slate-900">
              Quick<span className="text-teal-500">Drop</span>
            </span>
          </div>
        </div>
        <div className="hidden md:flex gap-8 font-bold uppercase text-[10px] tracking-[0.2em] text-slate-500">
          <a href="#features" className="hover:text-teal-500 transition-colors">Características</a>
          <a href="#success-stories" className="hover:text-teal-500 transition-colors">Casos de Éxito</a>
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
        <span className="inline-block bg-teal-50 text-teal-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-teal-100 shadow-sm">
          Líder en Comercio Local e Inteligente
        </span>
        <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase italic mb-8 text-slate-900">
          Más que un menú, <br />
          es tu <span className="text-teal-500 drop-shadow-sm">Centro de Control</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 font-medium mb-12 leading-relaxed">
          Sincroniza tus <strong>ventas de catálogo</strong> con un sistema inteligente de <strong>citas en tiempo real</strong>.
          Recibe pedidos estructurados, gestiona tu stock automáticamente y deja que QuickDrop proteja tu agenda.
          <span className="text-slate-900 font-bold block mt-2">Todo directo a tu WhatsApp y a tú panel de control, sin intermediarios.</span>
        </p>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button
            onClick={() => {
              const telefono = "523153545893";
              const mensaje = encodeURIComponent("¡Hola! Me interesa digitalizar mi negocio con QuickDrop. ¿Me podrían dar más información?");
              window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
            }}
            className="bg-slate-900 text-white px-10 py-6 rounded-[28px] font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] group"
          >
            Digitalizar mi negocio
            <ArrowRight size={22} className="text-teal-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex flex-col items-start gap-1">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-teal-500 flex items-center justify-center text-[10px] text-white font-bold">+50</div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
              Negocios activos hoy
            </p>
          </div>
        </div>
      </header>

      {/* SUCCESS STORIES SECTION */}
      <section id="success-stories" className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="text-teal-500 fill-teal-500" size={20} />
                <span className="text-teal-500 font-black uppercase text-xs tracking-widest">Negocios Reales</span>
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                Casos de <span className="text-teal-500">Éxito</span>
              </h2>
            </div>
            <p className="text-slate-400 font-bold max-w-sm uppercase text-[10px] tracking-[0.2em] leading-relaxed">
              Haz clic en cualquier negocio para ver su catálogo en acción.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "BioBalance Center",
                slug: "/biobalance-center",
                type: "Salud y Nutrición",
                color: "from-emerald-400 to-teal-600",
                desc: "Gestión de citas para consultas nutricionales y venta de suplementos."
              },
              {
                name: "Eco Fitness",
                slug: "/eco-fitness",
                type: "Ropa Deportiva",
                color: "from-orange-400 to-red-600",
                desc: "Catálogo de ropa con gestión de tallas, colores y stock sincronizado."
              },
              {
                name: "Barber Express",
                slug: "/barber-express",
                type: "Cuidado Personal",
                color: "from-slate-700 to-slate-900",
                desc: "Reserva de turnos en tiempo real para evitar choques. Mantene tu agenda organizada."
              }
            ].map((shop, i) => (
              /* USAMOS LINK PARA QUE TODA LA TARJETA SEA UN BOTÓN */
              <Link
                key={i}
                to={`/shop/${shop.slug}`}
                target='_blank'
                className="group relative bg-slate-50 rounded-[32px] p-8 border-2 border-transparent hover:border-slate-900 hover:bg-white hover:shadow-[20px_20px_0px_0px_rgba(79,209,197,0.1)] transition-all duration-300 block"
              >


                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 block">
                  {shop.type}
                </span>

                <h3 className="text-2xl font-black uppercase italic mb-4 tracking-tighter flex items-center gap-2">
                  {shop.name}
                  <ArrowRight size={20} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-teal-500" />
                </h3>

                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  {shop.desc}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 border-dashed">
                  <span className="text-slate-400 font-mono text-[11px] font-bold group-hover:text-slate-900 transition-colors">
                    quickdrop.shop{shop.slug}
                  </span>
                  <div className="p-3 bg-white rounded-full shadow-md group-hover:bg-teal-500 group-hover:text-white transition-colors border border-slate-100">
                    <ExternalLink size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
              <div className="absolute top-6 right-6 text-teal-500"><Coins size={32} /></div>
              <h3 className="text-3xl font-black uppercase italic mb-2">Emprendedor</h3>
              <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-widest">Ideal para iniciar</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">$0</span>
                <span className="text-slate-400 font-bold ml-2 italic text-sm">MXN /mes</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["1 crédito = 1 pedido recibido", "Recargas desde $50 MXN", "Variantes y extras ilimitados", "Soporte por chat", "Agenda para ver tus citas pendientes"].map((item, i) => (
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
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-slate-900">Más popular</div>
              <div className="absolute top-6 right-6 text-teal-500"><Rocket size={32} /></div>
              <h3 className="text-3xl font-black uppercase italic mb-2">PREMIUM</h3>
              <p className="text-teal-600 font-bold text-xs mb-6 uppercase tracking-widest">Negocios con flujo</p>
              <div className="mb-8 text-slate-900">
                <div>
                  <span className="text-md font-bold italic line-through text-slate-400 mr-2" style={{ color: 'red' }}>$350</span>
                  <span className='text-md font-bold italic text-slate-400'>Oferta de lanzamiento</span>
                </div>
                <span className="text-5xl font-black">$250</span>
                <span className="font-bold ml-2 italic text-slate-400 text-sm">MXN /mes</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["Todo lo del plan Emprendedor", "Pedidos ilimitados (0 créditos)", "Gestión de stock inteligente", "Soporte Prioritario 24/7"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-sm text-slate-800">
                    <Check size={18} className="text-teal-500" strokeWidth={4} /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => {
                const telefono = "523153545893";
                const mensaje = encodeURIComponent("¡Hola! Me interesa digitalizar mi negocio con QuickDrop. ¿Me podrían dar más información?");
                window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
              }} className="w-full bg-teal-500 text-slate-900 border-2 border-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all">
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
            desc: "Cero fricción: recibe pedidos listos para cobrar directamente en tu WhatsApp."
          },
          {
            icon: <ShieldCheck size={32} className="text-blue-500" />,
            title: "Control Total 360°",
            desc: "Gestiona tu inventario y analiza tus métricas de éxito desde un solo lugar."
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