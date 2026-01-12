import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Header } from '../components/Header';
import PublicCatalog from '../components/catalogo/PublicCatalog';
import PublicCart from '../components/catalogo/PublicCart';
import ServiceModal from '../components/ServiceModal';
import ItemOptionsModal from '../components/ItemOptionsModal';

const PublicShop = () => {
  const { slug } = useParams();

  const [data, setData] = useState({ business: null, items: [], posts: [] });
  const [allItems, setAllItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  const [activeTab, setActiveTab] = useState('menu');
  const [step, setStep] = useState(1);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [searchQuery, setSearchQuery] = useState(''); 
  const [inputValue, setInputValue] = useState('');   

  const [cart, setCart] = useState({});
  const [formData, setFormData] = useState({
    customer_name: '',
    address: '',
    appointment_datetime: '',
    notes: ''
  });
  const [likedPosts, setLikedPosts] = useState(new Set());

  // PERSISTENCIA
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

  // DEBOUNCE BÚSQUEDA
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // CARGA DE DATOS
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
        toast.error("Error al cargar la tienda");
      } finally { setLoading(false); }
    };
    fetchShop();
  }, [slug, currentPage, searchQuery]);

  // MAPPING DEL CARRITO
  const cartArray = Object.keys(cart).map(key => ({
    ...allItems[key],
    cartKey: key,
    quantity: cart[key]
  })).filter(item => item.id);

  const cartTotal = cartArray.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const hasService = cartArray.some(item => item.is_service);

  // LOGICA DE CANTIDADES
  const updateQuantity = (cartKey, delta) => {
    const item = allItems[cartKey];
    
    // Abrir modal si es nuevo con opciones
    if (delta > 0 && !item?.isCustom && (item?.variants?.length > 0 || item?.extras?.length > 0)) {
      setSelectedItem(item);
      setIsOptionsModalOpen(true);
      return;
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
  };

  // CONFIRMAR VARIANTES/EXTRAS
  const confirmAddition = (customItem) => {
    const variantId = customItem.selectedVariant?.id || 'base';
    const extrasIds = customItem.selectedExtras.map(e => e.id).sort().join('-');
    const cartKey = `${customItem.id}_v${variantId}_e${extrasIds}`;

    const currentQty = cart[cartKey] || 0;
    const totalDesired = currentQty + customItem.cartQuantity;
    const stockLimit = customItem.stock;

    if (!customItem.is_service && totalDesired > stockLimit) {
      toast.error(`Alcanzaste el máximo. Stock insuficiente. Disponible: ${stockLimit}`);
      return;
    }

    setAllItems(prev => ({
      ...prev,
      [cartKey]: { 
        ...customItem, 
        id: customItem.id,
        isCustom: true, 
        price: customItem.totalPrice,
        variant_name: customItem.selectedVariant?.name || null,
        extras_names: customItem.selectedExtras.map(e => e.name).join(", ")
      }
    }));

    setCart(prev => ({ ...prev, [cartKey]: totalDesired }));
    setIsOptionsModalOpen(false);
    toast.success("Agregado");
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
    try { await api.post(`/social/posts/${postId}/like`); } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      {cartTotal > 0 && step === 1 && (
        <button onClick={() => setStep(2)} className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-white">
          <ShoppingBag size={18} className="text-orange-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase opacity-60">Ver Carrito</p>
            <p className="text-lg font-black">${cartTotal}</p>
          </div>
        </button>
      )}

      <Header data={data} />

      {step === 1 && (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-100">
          <div className="flex">
            {['menu', 'gallery'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === t ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-300'}`}>
                {t === 'menu' ? 'Catálogo' : 'Publicaciones'}
              </button>
            ))}
          </div>
          {activeTab === 'menu' && (
            <div className="px-4 py-3 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Buscar..." className="w-full bg-slate-100 rounded-2xl py-3 pl-10 pr-10 text-sm font-medium outline-none" />
                {inputValue && <button onClick={() => setInputValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><X size={12}/></button>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-xl mx-auto">
        {step === 1 ? (
          <PublicCatalog {...{activeTab, data, cart, updateQuantity, handleLike, likedPosts, currentPage, setCurrentPage, totalItems, searchQuery, isloading: loading, inputValue}} />
        ) : (
          <PublicCart {...{cartArray, updateQuantity, setStep, formData, setFormData, cartTotal, hasService, business: data.business, slug, setCart}} />
        )}
      </div>

      <ServiceModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} item={selectedItem} onConfirm={confirmService} />
      <ItemOptionsModal isOpen={isOptionsModalOpen} onClose={() => setIsOptionsModalOpen(false)} item={selectedItem} onConfirm={confirmAddition} />
    </div>
  );
};

export default PublicShop;