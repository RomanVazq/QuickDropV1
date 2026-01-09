import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componentes internos
import { Header } from '../components/Header';
import PublicCatalog from '../components/PublicCatalog';
import PublicCart from '../components/PublicCart';
import ServiceModal from '../components/ServiceModal';

const PublicShop = () => {
  const { slug } = useParams();

  // --- ESTADOS DE DATOS Y PAGINACIÓN ---
  const [data, setData] = useState({ business: null, items: [], posts: [] });
  const [allItems, setAllItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState('menu');
  const [step, setStep] = useState(1);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // BÚSQUEDA
  const [searchQuery, setSearchQuery] = useState(''); // Lo que se manda a la API
  const [inputValue, setInputValue] = useState('');   // Lo que el usuario escribe (instantáneo)

  // --- ESTADOS DE CARRITO Y FORMULARIO ---
  const [cart, setCart] = useState({});
  const [formData, setFormData] = useState({
    customer_name: '',
    address: '',
    appointment_datetime: '',
    notes: ''
  });
  const [likedPosts, setLikedPosts] = useState(new Set());

  // ==========================================
  // 1. PERSISTENCIA (LocalStorage)
  // ==========================================
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${slug}`);
    const savedItems = localStorage.getItem(`items_cache_${slug}`);
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedItems) setAllItems(JSON.parse(savedItems));
  }, [slug]);

  useEffect(() => {
    localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
    if (Object.keys(allItems).length > 0) {
      localStorage.setItem(`items_cache_${slug}`, JSON.stringify(allItems));
    }
  }, [cart, allItems, slug]);

  // ==========================================
  // 2. LÓGICA DE DEBOUNCE PARA BÚSQUEDA
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(0); // Reiniciar paginación al buscar
    }, 500); // Espera 500ms

    return () => clearTimeout(timer);
  }, [inputValue]);

  // ==========================================
  // 3. CARGA DE DATOS DESDE API
  // ==========================================
  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        const skip = currentPage * itemsPerPage;

        const [bizRes, socialRes] = await Promise.all([
          api.get(`/business/public/${slug}?skip=${skip}&limit=${itemsPerPage}&search=${searchQuery}`),
          api.get(`/social/feed/${slug}`).catch(() => ({ data: [] }))
        ]);

        const newItems = bizRes.data.items || [];

        setAllItems(prev => {
          const updated = { ...prev };
          newItems.forEach(item => {
            updated[item.id] = item;
          });
          return updated;
        });

        setData({
          ...bizRes.data,
          items: newItems,
          posts: socialRes.data
        });

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
  }, [slug, currentPage, searchQuery]); // Se dispara al cambiar página o búsqueda

  // ==========================================
  // 4. GESTIÓN DE CARRITO
  // ==========================================
  const cartArray = Object.keys(cart).map(id => ({
    ...(allItems[id] || {}),
    quantity: cart[id]
  })).filter(item => item.id);

  const updateQuantity = (id, delta) => {
    const item = allItems[id];
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

  const cartTotal = cartArray.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const hasService = cartArray.some(item => item.is_service);

  if (loading && currentPage === 0 && !searchQuery) {
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
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-white animate-in slide-in-from-bottom-10"
        >
          <ShoppingBag size={18} className="text-orange-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase opacity-60">Checkout</p>
            <p className="text-lg font-black">${cartTotal}</p>
          </div>
        </button>
      )}

      <Header data={data} />

      {step === 1 && (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-100">
          <div className="flex">
            <button onClick={() => setActiveTab('menu')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'menu' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}>
              Catálogo
            </button>
            <button onClick={() => setActiveTab('gallery')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'gallery' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}>
              Publicaciones
            </button>
          </div>

          {/* BARRA DE BÚSQUEDA DINÁMICA */}
          {activeTab === 'menu' && (
            <div className="px-4 py-3 bg-white animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative group">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${inputValue ? 'text-slate-900' : 'text-slate-400'}`} size={16} />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Buscar producto o servicio..."
                  className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-10 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:bg-slate-50 transition-all outline-none"
                />
                {inputValue && (
                  <button
                    onClick={() => setInputValue('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full text-slate-500 hover:text-slate-900"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-xl mx-auto">
        {step === 1 ? (
          <PublicCatalog
            activeTab={activeTab}
            data={data}
            cart={cart}
            updateQuantity={updateQuantity}
            handleLike={handleLike}
            likedPosts={likedPosts}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            searchQuery={searchQuery} // Pasar la query para estados vacíos
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
            slug={slug}
            setCart={setCart}
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