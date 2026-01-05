import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, UtensilsCrossed, Camera, Calendar, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componentes internos
import PublicCatalog from '../components/PublicCatalog';
import PublicCart from '../components/PublicCart';
import ServiceModal from '../components/ServiceModal';

const PublicShop = () => {
  const { slug } = useParams();
  
  // ESTADOS DE DATOS
  const [data, setData] = useState({ business: null, items: [], posts: [] });
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DE UI
  const [activeTab, setActiveTab] = useState('menu'); 
  const [step, setStep] = useState(1); // 1: Catálogo, 2: Checkout
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // ESTADOS DE CARRITO Y FORMULARIO
  const [cart, setCart] = useState({}); 
  const [formData, setFormData] = useState({ 
    customer_name: '', 
    address: '', 
    appointment_datetime: '', 
    notes: '' 
  });

  // ESTADO DE INTERACCIÓN (LIKES)
  const [likedPosts, setLikedPosts] = useState(new Set());

  // 1. CARGA DE DATOS
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const [bizRes, socialRes] = await Promise.all([
          api.get(`/business/public/${slug}`),
          api.get(`/social/feed/${slug}`).catch(() => ({ data: [] }))
        ]);
        
        setData({ ...bizRes.data, posts: socialRes.data });
        
        // Sincronizar likes desde el servidor
        const initialLikes = new Set(
          socialRes.data.filter(p => p.is_liked).map(p => p.id)
        );
        setLikedPosts(initialLikes);
      } catch (err) {
        toast.error("Negocio no encontrado");
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [slug]);

  // 2. LÓGICA DE CARRITO Y SERVICIOS
const updateQuantity = (id, delta) => {
  const item = data.items.find(i => i.id === id);
  
  // Si el item es un servicio y el usuario intenta agregar (delta > 0)
  if (item?.is_service && delta > 0) {
    // Verificar si ya hay algún servicio en el carrito
    const hasExistingService = cartArray.some(cartItem => cartItem.is_service);

    if (hasExistingService && !cart[id]) {
      toast.error("Solo puedes agendar un servicio por cita. Elimina el actual para elegir otro.");
      return;
    }

    // Si no está en el carrito, abrimos el modal para elegir fecha
    if (!cart[id]) {
      setSelectedService(item);
      setIsServiceModalOpen(true);
      return;
    }
    
    // Si ya está en el carrito, no permitimos subir la cantidad de 1
    if (cart[id] >= 1) {
      toast.error("La cantidad para servicios está limitada a 1 por cita.");
      return;
    }
  }

  // Lógica estándar para productos físicos o eliminar
  setCart(prev => {
    const currentQty = prev[id] || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      const { [id]: _, ...rest } = prev;
      return rest;
    }
    return { ...prev, [id]: newQty };
  });
};

  const confirmService = (id, date) => {
    setCart(prev => ({ ...prev, [id]: 1 }));
    setFormData(prev => ({ ...prev, appointment_datetime: date }));
    setIsServiceModalOpen(false);
    toast.success("Horario seleccionado");
  };

  // 3. LÓGICA DE SOCIAL (LIKES)
  const handleLike = async (postId) => {
    const isLiked = likedPosts.has(postId);
    
    // Optimistic Update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      isLiked ? newSet.delete(postId) : newSet.add(postId);
      return newSet;
    });

    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => 
        p.id === postId 
          ? { ...p, likes_count: isLiked ? (p.likes_count - 1) : (p.likes_count + 1) } 
          : p
      )
    }));

    try {
      await api.post(`/social/posts/${postId}/like`);
    } catch (err) {
      toast.error("Error al procesar like");
    }
  };

  // 4. CÁLCULOS DERIVADOS
  const cartArray = Object.keys(cart).map(id => ({
    ...data.items.find(i => i.id === id),
    quantity: cart[id]
  }));

  const cartTotal = cartArray.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const hasService = cartArray.some(item => item.is_service);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-300 uppercase tracking-tighter">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      
      {/* BOTÓN FLOTANTE CARRITO */}
      {cartTotal > 0 && step === 1 && (
        <button 
          onClick={() => setStep(2)}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-white animate-in slide-in-from-bottom-10"
        >
          <div className="bg-orange-500 p-2 rounded-xl text-white">
            <ShoppingBag size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase opacity-60 leading-none">Ver Carrito</p>
            <p className="text-lg font-black">${cartTotal}</p>
          </div>
        </button>
      )}

      {/* HEADER DE TIENDA */}
      <div className="flex items-center gap-4 p-6 pt-12 border-b border-slate-50">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black italic shadow-lg ring-4 ring-slate-50">
          {data.business?.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            {data.business?.name}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest italic flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Tienda Verificada
          </p>
        </div>
      </div>

      {/* NAVEGACIÓN TABS (Solo en paso 1) */}
      {step === 1 && (
        <div className="flex bg-white sticky top-0 z-40 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('menu')} 
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'menu' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}
          >
            <UtensilsCrossed size={16}/> Catálogo
          </button>
          <button 
            onClick={() => setActiveTab('gallery')} 
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'gallery' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}
          >
            <Camera size={16}/> Publicaciones
          </button>
        </div>
      )}

      {/* CONTENIDO DINÁMICO */}
      <div className="max-w-xl mx-auto">
        {step === 1 ? (
          <PublicCatalog 
            activeTab={activeTab}
            data={data}
            cart={cart}
            updateQuantity={updateQuantity}
            handleLike={handleLike}
            likedPosts={likedPosts}
          />
        ) : (
          <PublicCart 
            cartArray={cartArray}
            updateQuantity={updateQuantity}
            setStep={setStep}
            formData={formData}
            setFormData={setFormData}
            cartTotal={cartTotal}
            hasService={hasService}
            business={data.business}
          />
        )}
      </div>

      {/* MODAL PARA SERVICIOS (AGENDAR) */}
      <ServiceModal 
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        item={selectedService}
        onConfirm={confirmService}
      />
    </div>
  );
};

export default PublicShop;