import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import OrdersDashboard from './OrdersDashboard';
import {
  Package, ShoppingBag, Plus, Trash2, X, Pencil, Camera,
  Grid3X3, Heart, Image as ImageIcon, MapPin, User,
  DollarSign, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, Settings,
  Search, MessageSquare, Layers, Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfigBusiness } from '../components/PerfilCustom';
import { ProductOptionsManager } from '../components/ProductOptionsManager';
import AdminCalendar from '../components/dashboard/AdminCalendar';
import alertSound from '../assets/sound.mp3';


// --- COMPONENTE: VISTA DE MURO ---
const PostsView = ({ posts, onDelete }) => {
  if (posts.length === 0) return <div className="py-20 text-center font-black opacity-20 uppercase italic tracking-widest">No hay publicaciones aún</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 group">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {post.image_url && <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            <button onClick={() => onDelete(post.id)} className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-red-500 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4 line-clamp-3">{post.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- DASHBOARD PRINCIPAL ---
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [business, setBusiness] = useState({ name: '', slug: '', tenant_id: '', wallet: { balance: 0 } });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const limit = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: 0, description: '', is_service: false });
  const [variants, setVariants] = useState([]);
  const [extras, setExtras] = useState([]);
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [orders, setOrders] = useState([]);
  const [additionalFiles, setAdditionalFiles] = useState([null, null, null]);
  // 1. FUNCIÓN DE CARGA DE DATOS (Se llama al iniciar y cuando hay un nuevo pedido)
  const fetchData = async () => {
    try {
      setLoading(true);
      const skip = currentPage * limit;
      const [itemsRes, meRes, ordersRes] = await Promise.all([
        api.get(`/business/items?skip=${skip}&limit=${limit}&q=${inputValue}`),
        api.get('/business/me'),
        api.get('/orders/my-orders')
      ]);
      setItems(itemsRes.data.items || []);
      setTotalItems(itemsRes.data.total || 0);
      setBusiness(meRes.data);
      setOrders(ordersRes.data || []);
      const postsRes = await api.get('/social/my-posts');
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data.items || []));
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) window.location.href = '/login';
    } finally { setLoading(false); }
  };

  // 2. WEBSOCKET GLOBAL (Escucha pedidos en cualquier pestaña)
  useEffect(() => {
    if (!business.tenant_id) return;

    const isLocal = window.location.hostname === 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'localhost:8000';
    const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];

    const wsUrl = `${protocol}://${host}/ws/${business.tenant_id}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "NEW_ORDER") {
          // Sonido
          const audio = new Audio(alertSound);
          audio.play().catch(() => console.log("Audio bloqueado o no encontrado"));

          // Toast
          toast.success("¡NUEVO PEDIDO RECIBIDO!", {
            duration: 8000,
            style: { background: '#0f172a', color: '#fff', borderRadius: '15px' }
          });

          // Recargar todo (Balance e Inventario)
          fetchData();
        }
      } catch (err) {
        console.error("Error WS:", err);
      }
    };

    return () => socket.close();
  }, [business.tenant_id]);

  // Efecto para búsqueda y paginación
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(handler);
  }, [currentPage, inputValue]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));
    formData.append("variants", JSON.stringify(variants));
    formData.append("extras", JSON.stringify(extras));

    if (file) formData.append("image", file);
    additionalFiles.forEach((f) => {
      if (f) {

        formData.append("additional_images", f);
      }
    });

    try {
      if (isEditing) await api.put(`/business/items/${editingItem.id}`, formData);
      else await api.post("/business/items", formData);
      toast.success("¡Operación exitosa!");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error al guardar"); }
  };

  const resetForm = () => {
    setIsModalOpen(false); setIsPostModalOpen(false); setIsEditing(false);
    setEditingItem(null); setFile(null); setVariants([]); setExtras([]);
    setNewProduct({ name: '', price: '', stock: 0, description: '', is_service: false });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setNewProduct({ name: item.name, price: item.price, stock: item.stock || 0, description: item.description || '', is_service: item.is_service || false });
    setVariants(item.variants || []);
    setExtras(item.extras || []);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("¿Eliminar este ítem?")) return;
    try {
      await api.delete(`/business/items/${itemId}`);
      toast.success("Eliminado");
      fetchData();
    } catch (err) { toast.error("Error al eliminar"); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    try {
      await api.delete(`/social/posts/${postId}`);
      toast.success("Publicación eliminada");
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) { toast.error("Error al eliminar"); }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{business.name || 'Cargando...'}</h1>
            <nav className="flex gap-4 mt-4 flex-wrap">
              {['main', 'orders', 'posts', 'profile', 'calendar'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === tab ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  {tab === 'main' ? 'Inventario' : tab === 'orders' ? 'Pedidos' : tab === 'posts' ? 'Muro' : tab === 'calendar' ? 'Calendario' : 'Perfil'}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex gap-2 w-full sm:w-[50%] flex-wrap md:w-auto">
            <button onClick={() => setIsPostModalOpen(true)} className="flex-1 md:flex-none bg-slate-100 text-slate-900 font-black text-xs uppercase px-6 py-3 rounded-2xl border border-slate-200"><Camera size={18} className="inline mr-2" /> Post</button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-orange-500 text-white font-black text-xs uppercase px-4 py-3 rounded-2xl shadow-lg"><Plus size={18} className="inline mr-2" /> Item</button>
          </div>
        </div>

        {/* CONTENIDO SEGÚN PESTAÑA */}
        {activeTab === 'orders' ? <OrdersDashboard tenantId={business.tenant_id} /> :
          activeTab === 'posts' ? <PostsView posts={posts} onDelete={handleDeletePost} /> :
            activeTab === 'profile' ? <ConfigBusiness /> : activeTab === 'calendar' ? <AdminCalendar orders={orders} /> : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Balance</p>
                    <p className="text-4xl font-black text-emerald-500 italic">${business.wallet?.balance || 0}</p>
                  </div>
                  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Catálogo</p>
                    <p className="text-4xl font-black italic text-slate-900">{totalItems} <span className="text-sm not-italic opacity-30">ITEMS</span></p>
                  </div>
                </div>

                {/* BARRA DE BÚSQUEDA */}
                <div className="mb-6">
                  <div className="relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${inputValue ? 'text-slate-900' : 'text-slate-400'}`} size={18} />
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => { setInputValue(e.target.value); setCurrentPage(0); }}
                      placeholder="Buscar producto o servicio..."
                      className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-4 pl-12 pr-12 text-sm font-bold shadow-sm focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                    />
                    {inputValue && (
                      <button onClick={() => setInputValue('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-full hover:text-red-500"><X size={14} /></button>
                    )}
                  </div>
                </div>

                {/* TABLA DE PRODUCTOS */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Producto</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center tracking-widest">Info</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          [...Array(limit)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="px-8 py-6"><div className="h-14 w-14 bg-slate-100 rounded-2xl" /></td>
                              <td colSpan="2"></td>
                            </tr>
                          ))
                        ) : items.length === 0 ? (
                          <tr><td colSpan="3" className="py-20 text-center opacity-20 font-black uppercase italic">No hay resultados</td></tr>
                        ) : (
                          items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-8 py-6 flex items-center gap-4">
                                <img src={item.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
                                <div>
                                  <p className="font-bold text-slate-800 text-lg leading-none">{item.name}</p>
                                  <p className="text-teal-500 font-black text-sm mt-1">${item.price}</p>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="flex justify-center gap-1">
                                  {item.is_service ?
                                    <span className="text-[9px] font-black px-2 py-1 bg-teal-50 text-teal-600 rounded-md uppercase">Servicio</span> :
                                    <span className="text-[9px] font-black px-2 py-1 bg-orange-50 text-orange-600 rounded-md uppercase">Stock: {item.stock}</span>
                                  }
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openEdit(item)} className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all"><Pencil size={18} /></button>
                                  <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINACIÓN */}
                  <div className="flex justify-between items-center px-8 py-6 bg-slate-50/50 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400">Página {currentPage + 1} de {Math.ceil(totalItems / limit) || 1}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 bg-white rounded-xl border border-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
                      <button onClick={() => setCurrentPage(p => p + 1)} disabled={(currentPage + 1) * limit >= totalItems} className="p-2 bg-white rounded-xl border border-slate-100 disabled:opacity-30"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* MODAL PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 max-w-xl w-full my-auto shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-2xl text-white">
                  {isEditing ? <Pencil size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                  {isEditing ? "Editar" : "Nuevo"} Item
                </h2>
              </div>
              <button onClick={resetForm} className="bg-slate-100 p-2 rounded-full hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-4">
                  <input type="text" placeholder="Nombre" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                  <textarea placeholder="Descripción detallada..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900 min-h-[80px] resize-none" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 ml-2">Precio Base</p>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                </div>
                <div className={`space-y-1 transition-opacity ${newProduct.is_service ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 ml-2">Stock</p>
                  <input type="number" placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} disabled={newProduct.is_service} />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl cursor-pointer">
                    <span className="text-[10px] font-black uppercase text-slate-500">¿Es un servicio?</span>
                    <input type="checkbox" className="w-5 h-5 accent-teal-500" checked={newProduct.is_service} onChange={e => setNewProduct({ ...newProduct, is_service: e.target.checked })} />
                  </label>
                </div>
              </div>

              <ProductOptionsManager title="Variantes" options={variants} setOptions={setVariants} type="variant" />
              <ProductOptionsManager title="Extras" options={extras} setOptions={setExtras} type="extra" />
              {/* --- SECCIÓN IMÁGENES ADICIONALES --- */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 ml-2">Galería de Variantes (Máx 3)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <label key={i} className={`relative flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-3xl transition-all cursor-pointer 
                ${additionalFiles[i] ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 bg-slate-50 hover:border-slate-400'}`}>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const newFiles = [...additionalFiles];
                          newFiles[i] = e.target.files[0];
                          setAdditionalFiles(newFiles);
                        }}
                      />
                      {additionalFiles[i] ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-teal-500 text-white p-1 rounded-full mb-1">
                            <Plus size={12} className="rotate-45" />
                          </div>
                          <span className="text-[8px] font-black uppercase truncate max-w-[60px]">{additionalFiles[i].name}</span>
                        </div>
                      ) : (
                        <Plus size={20} className="text-slate-300" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <label className="block p-4 bg-slate-900 text-white rounded-[2rem] text-center cursor-pointer hover:bg-black transition-all">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                <span className="text-xs font-black uppercase">{file ? file.name : "Subir Foto"}</span>
              </label>

              <button type="submit" className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                {isEditing ? "Actualizar cambios" : "Publicar ahora"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POST */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2 rounded-2xl text-white"><Camera size={20} /></div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Nueva Publicación</h2>
              </div>
              <button onClick={() => setIsPostModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData();
              formData.append('content', postContent);
              if (file) formData.append('image', file);
              try {
                await api.post('/social/posts', formData);
                toast.success("¡Publicado!");
                setPostContent(''); setFile(null); setIsPostModalOpen(false);
                fetchData();
              } catch (err) { toast.error("Error al publicar"); }
            }} className="space-y-6">
              <textarea placeholder="¿Qué hay de nuevo?" className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold outline-none border-2 border-transparent focus:border-slate-900 min-h-[150px] resize-none" value={postContent} onChange={(e) => setPostContent(e.target.value)} required />
              <label className="block p-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-[2rem] text-center cursor-pointer hover:border-slate-900 hover:text-slate-900 transition-all">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{file ? file.name : "Imagen"}</span>
                </div>
              </label>
              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase shadow-lg">Publicar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;