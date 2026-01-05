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
  
  // --- ESTADOS DE DATOS Y PAGINACIÓN ---
  const [data, setData] = useState({ business: null, items: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;
  
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState('menu'); 
  const [step, setStep] = useState(1); // 1: Catálogo, 2: Checkout
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // --- ESTADOS DE CARRITO Y FORMULARIO ---
  const [cart, setCart] = useState({}); 
  const [formData, setFormData] = useState({ 
    customer_name: '', 
    address: '', 
    appointment_datetime: '', 
    notes: '' 
  });

  const [likedPosts, setLikedPosts] = useState(new Set());

  // 1. CARGA DE DATOS (Con dependencia de currentPage)
  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        const skip = currentPage * itemsPerPage;
        
        // Llamada al backend con skip y limit
        const [bizRes, socialRes] = await Promise.all([
          api.get(`/business/public/${slug}?skip=${skip}&limit=${itemsPerPage}`),
          api.get(`/social/feed/${slug}`).catch(() => ({ data: [] }))
        ]);
        
        setData({ 
          ...bizRes.data, 
          posts: socialRes.data 
        });

        // Guardamos el total de items para controlar el botón "Siguiente"
        setTotalItems(bizRes.data.total_items || 0);
        
        const initialLikes = new Set(
          socialRes.data.filter(p => p.is_liked).map(p => p.id)
        );
        setLikedPosts(initialLikes);
      } catch (err) {
        toast.error("Error al cargar la tienda");
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [slug, currentPage]); // Se dispara cada vez que cambias de página

  // 2. LÓGICA DE CARRITO
  const updateQuantity = (id, delta) => {
    const item = data.items.find(i => i.id === id);
    
    if (item?.is_service && delta > 0) {
      const hasExistingService = cartArray.some(cartItem => cartItem.is_service);
      if (hasExistingService && !cart[id]) {
        toast.error("Solo un servicio por cita.");
        return;
      }
      if (!cart[id]) {
        setSelectedService(item);
        setIsServiceModalOpen(true);
        return;
      }
      if (cart[id] >= 1) return;
    }

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
    toast.success("Horario agendado");
  };

  // 3. LÓGICA DE LIKES
  const handleLike = async (postId) => {
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      isLiked ? newSet.delete(postId) : newSet.add(postId);
      return newSet;
    });
    try {
      await api.post(`/social/posts/${postId}/like`);
    } catch (err) {
      toast.error("Error en el servidor");
    }
  };

  // 4. CÁLCULOS
  const cartArray = Object.keys(cart).map(id => ({
    ...data.items.find(i => i.id === id),
    quantity: cart[id]
  }));

  const cartTotal = cartArray.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const hasService = cartArray.some(item => item.is_service);

  if (loading && currentPage === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      
      {/* BOTÓN FLOTANTE CARRITO */}
      {cartTotal > 0 && step === 1 && (
        <button 
          onClick={() => setStep(2)}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-white"
        >
          <ShoppingBag size={18} className="text-orange-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase opacity-60">Checkout</p>
            <p className="text-lg font-black">${cartTotal}</p>
          </div>
        </button>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 p-6 pt-12 border-b border-slate-50">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black italic shadow-lg">
          {data.business?.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{data.business?.name}</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </p>
        </div>
      </div>

      {/* TABS */}
      {step === 1 && (
        <div className="flex bg-white sticky top-0 z-40 border-b border-slate-100">
          <button onClick={() => setActiveTab('menu')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'menu' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}>
            Menú
          </button>
          <button onClick={() => setActiveTab('gallery')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'gallery' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}>
            Galería
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-xl mx-auto">
        {step === 1 ? (
          <PublicCatalog 
            activeTab={activeTab}
            data={data}
            cart={cart}
            updateQuantity={updateQuantity}
            handleLike={handleLike}
            likedPosts={likedPosts}
            // Props de paginación pasadas al hijo
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
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