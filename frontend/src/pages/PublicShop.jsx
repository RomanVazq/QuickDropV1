import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, Search, X, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Header } from '../components/Header';
import PublicCatalog from '../components/catalogo/PublicCatalog';
import PublicCart from '../components/catalogo/PublicCart';
import ServiceModal from '../components/ServiceModal';
import ItemOptionsModal from '../components/ItemOptionsModal';
import ItemDetailModal from '../components/catalogo/ItemDetailModal';
import utils from '../utils/utils';



const PublicShop = () => {
  const { slug } = useParams();

  const [data, setData] = useState({ business: null, items: [], posts: [] });
  const [allItems, setAllItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12; // Aumentado para mejor flujo visual

  const [activeTab, setActiveTab] = useState('menu');
  const [step, setStep] = useState(1);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);



  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [cart, setCart] = useState({});
  const [formData, setFormData] = useState({
    customer_name: '', address: '', appointment_datetime: '', notes: ''
  });
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // --- PERSISTENCIA ---
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

  // --- DEBOUNCE BÚSQUEDA ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // --- CARGA DE DATOS ---
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
            if (!updated[item.id] || !updated[item.id].isCustom) {
              updated[item.id] = item;
            }
          });
          return updated;
        });

        setData({ ...bizRes.data, items: newItems, posts: socialRes.data });
        setTotalItems(bizRes.data.total_items || 0);
        setLikedPosts(new Set(socialRes.data.filter(p => p.is_liked).map(p => p.id)));
      } catch (err) {
        toast.error("Error al cargar");
        if (err.response?.status === 404) window.location.href = '/not-found';
      } finally { setLoading(false); }
    };
    fetchShop();
  }, [slug, currentPage, searchQuery]);

  // --- LOGICA DE NEGOCIO ---
  const cartArray = Object.keys(cart).map(key => ({
    ...allItems[key], cartKey: key, quantity: cart[key]
  })).filter(item => item.id);

  const cartTotal = cartArray.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const hasService = cartArray.some(item => item.is_service);

  const updateLocalStock = (productId, variantId, delta) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stock: p.stock - delta,
            variants: p.variants?.map(v =>
              v.id === variantId ? { ...v, stock: v.stock - delta } : v
            )
          };
        }
        return p;
      })
    }));
  };

  const updateQuantity = (cartKey, delta) => {
    const item = allItems[cartKey];
    if (!item) return;

    if (delta > 0 && !item?.isCustom && (item?.variants?.length > 0 || item?.extras?.length > 0)) {
      setSelectedItem(item);
      setIsOptionsModalOpen(true);
      return;
    }

    if (delta > 0 && !item.is_service) {
      const currentInStock = data.items.find(p => p.id === (item.id))?.stock;
      if (currentInStock <= 0) {
        toast.error("Sin stock");
        return;
      }
    }

    if (item?.is_service && delta > 0) {
      if (cartArray.some(ci => ci.is_service) && !cart[cartKey]) {
        toast.error("Solo un servicio por cita.");
        return;
      }
      if (!cart[cartKey]) {
        setSelectedItem(item);
        setIsServiceModalOpen(true);
        return;
      }
      if (cart[cartKey] >= 1) return;
    }

    setCart(prev => {
      const newQty = (prev[cartKey] || 0) + delta;
      if (newQty <= 0) {
        const { [cartKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cartKey]: newQty };
    });

    if (!item.is_service) updateLocalStock(item.id, item.selectedVariant?.id, delta);
  };

  const confirmAddition = (customItem) => {
    const variantId = customItem.selectedVariant?.id || 'base';
    const extrasIds = customItem.selectedExtras.map(e => e.id).sort().join('-');
    const cartKey = `${customItem.id}_v${variantId}_e${extrasIds}`;

    if (!customItem.is_service) {
      updateLocalStock(customItem.id, customItem.selectedVariant?.id, customItem.cartQuantity);
    }

    setAllItems(prev => ({
      ...prev,
      [cartKey]: {
        ...customItem,
        isCustom: true,
        price: customItem.totalPrice,
        variant_name: customItem.selectedVariant?.name || null,
        extras_names: customItem.selectedExtras.map(e => e.name).join(", ")
      }
    }));

    setCart(prev => ({ ...prev, [cartKey]: (prev[cartKey] || 0) + customItem.cartQuantity }));
    setIsOptionsModalOpen(false);
    toast.success("Agregado");
  };

  const confirmService = (id, date) => {
    setCart(prev => ({ ...prev, [id]: 1 }));
    setFormData(prev => ({ ...prev, appointment_datetime: date }));
    setIsServiceModalOpen(false);
  };

  const handleLike = async (postId) => {
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      isLiked ? newSet.delete(postId) : newSet.add(postId);
      return newSet;
    });
    try { await api.post(`/social/posts/${postId}/like`); } catch (err) { }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-slate-900 selection:text-white">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] relative flex flex-col">

        {/* Header Superior */}
        <Header data={data} />

        {/* Navegación de Tabs Sticky */}
        {step === 1 && (
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 space-y-3">
            <div className="space-y-0 absolute top-0 transform -translate-y-[85%] left-0 right-0 px-6 text-center">
              <p
                className="text-[15px] font-bold uppercase tracking-[0.4em] ml-1"
                style={{
                  color: utils.get_primary_color(data),
                  textShadow: `1px 1px 0px ${utils.get_secondary_color(data)}`
                }}
              >
                Bienvenido a
              </p>
              <h1
                className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-[0.85]"
                style={{
                  color: utils.get_primary_color(data),
                  WebkitTextStroke: `2px ${utils.get_secondary_color(data)}`,
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(4px 4px 2px rgba(0,0,0,0.2))'
                }}
              >
                {data.business?.name || "Cargando..."}
              </h1>
            </div>
            <br />

            <div className="flex bg-slate-100/80 p-1 rounded-2xl">
              {['menu', 'gallery'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === t
                    ? 'bg-black text-slate-900 shadow-sm text-white'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {t === 'menu' ? 'Catálogo' : 'Explorar'}
                </button>
              ))}
            </div>

            {activeTab === 'menu' && (
              <div className="relative group animate-in slide-in-from-top-2 duration-300">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={15} />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Busca tu producto favorito..."
                  className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-11 pr-10 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                />
                {inputValue && (
                  <button onClick={() => setInputValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-slate-900">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contenido Principal */}
        <main className="flex-1">
          {step === 1 ? (
            <PublicCatalog {...{
              activeTab, data, cart, updateQuantity, handleLike, likedPosts,
              currentPage, setCurrentPage, totalItems, searchQuery, isloading: loading, inputValue, setIsDetailModalOpen, setSelectedItem
            }} />
          ) : (
            <PublicCart {...{
              cartArray, updateQuantity, setStep, formData, setFormData,
              cartTotal, hasService, business: data.business, slug, setCart
            }} />
          )}
        </main>

        {/* Botón Carrito Flotante (Diseño Premium) */}
        {cartTotal > 0 && step === 1 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-6 z-50">
            <button
              onClick={() => setStep(2)}
              className="w-full bg-slate-900 text-white group p-2 pl-6 rounded-[2.5rem] flex items-center justify-between shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ShoppingBag size={20} className="text-white" />
                  <span className="absolute -top-1 -right-1 bg-white text-slate-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {cartArray.length}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-white/40 leading-none mb-1">Tu orden</p>
                  <p className="text-lg font-black italic tracking-tight">${cartTotal.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/10 group-hover:bg-white/20 px-6 py-4 rounded-[2rem] flex items-center gap-2 transition-colors">
                <span className="text-[11px] font-black uppercase tracking-widest">Revisar</span>
                <ChevronRight size={14} strokeWidth={3} />
              </div>
            </button>
          </div>
        )}

        {/* Modales */}
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          item={selectedItem}
          onConfirm={confirmService}
         businessHours={data?.business?.business_hours || []}
         interval={data?.business?.appointment_interval || 30}
        />

        <ItemOptionsModal
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          cart={cart}
          item={selectedItem}
          onConfirm={confirmAddition}
        />
      </div>
      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItem}
        onAdd={updateQuantity}
      />
    </div>
  );
};

export default PublicShop;