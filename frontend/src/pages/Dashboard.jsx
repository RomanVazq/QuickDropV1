import React, { useState, useEffect } from 'react';
import api from '../services/api';
import OrdersDashboard from './OrdersDashboard';
import {
  Package, ShoppingBag, Plus, Trash2, X, Pencil, Camera,
  Grid3X3, Heart, Image as ImageIcon, MapPin, User,
  DollarSign, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, Settings,
  MessageSquare, Layers, Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfigBusiness } from '../components/PerfilCustom';

// --- COMPONENTE AISLADO: GESTIÓN DE VARIANTES Y EXTRAS ---
const ProductOptionsManager = ({ options, setOptions, title, type = 'variant' }) => {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const addOption = () => {
    if (!itemName || !itemPrice) return;
    const newOption = {
      id: `temp-${Date.now()}`,
      name: itemName,
      price: parseFloat(itemPrice)
    };
    setOptions([...options, newOption]);
    setItemName('');
    setItemPrice('');
  };

  const removeOption = (id) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  return (
    <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 space-y-3">
      <div className="flex items-center gap-2">
        {type === 'variant' ? <Layers size={14} className="text-slate-400" /> : <Tag size={14} className="text-slate-400" />}
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Nombre" className="flex-1 p-2 bg-white rounded-xl text-xs font-bold outline-none border border-slate-100" value={itemName} onChange={e => setItemName(e.target.value)} />
        <input type="number" placeholder="$" className="w-16 p-2 bg-white rounded-xl text-xs font-bold outline-none border border-slate-100" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
        <button type="button" onClick={addOption} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-orange-500 transition-colors"><Plus size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 animate-in zoom-in-95">
            <span className="text-[10px] font-black uppercase text-slate-700">{opt.name}</span>
            <span className="text-[10px] font-bold text-orange-500">+${opt.price}</span>
            <button type="button" onClick={() => removeOption(opt.id)} className="text-slate-300 hover:text-red-500"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENTE INTERNO: GESTIÓN DE POSTS ---
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
  const [business, setBusiness] = useState({ name: '', slug: '', wallet: { balance: 0 } });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: 0, description: '', is_service: false });
  const [variants, setVariants] = useState([]);
  const [extras, setExtras] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => { fetchData(); }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const skip = currentPage * limit;
      const [itemsRes, meRes] = await Promise.all([
        api.get(`/business/items?skip=${skip}&limit=${limit}`),
        api.get('/business/me')
      ]);
      setItems(itemsRes.data.items || []);
      setTotalItems(itemsRes.data.total || 0);
      setBusiness(meRes.data);
      try {
        const postsRes = await api.get('/social/my-posts');
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data.items || []));
      } catch (e) { setPosts([]); }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Acceso denegado: No eres administrador");
        window.location.href = '/login';
      } else if (err.response?.status === 401) {
        toast.error("Sesión expirada, vuelve a iniciar sesión");
        window.location.href = '/login';
      } else {
        toast.error("Error al cargar datos del sistema");
        window.location.href = '/login';
      }
    } finally { setLoading(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));
    formData.append("variants", JSON.stringify(variants));
    formData.append("extras", JSON.stringify(extras));
    if (file) formData.append("image", file);

    try {
      if (isEditing) await api.put(`/business/items/${editingItem.id}`, formData);
      else await api.post("/business/items", formData);
      toast.success("¡Operación exitosa!");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error en la operación"); }
  };

  const resetForm = () => {
    setIsModalOpen(false); setIsPostModalOpen(false); setIsEditing(false);
    setEditingItem(null); setFile(null); setVariants([]); setExtras([]);
    setNewProduct({ name: '', price: '', stock: 0, description: '', is_service: false });
    setPostContent("");
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setNewProduct({ name: item.name, price: item.price, stock: item.stock, description: item.description, is_service: item.is_service });
    setVariants(item.variants || []);
    setExtras(item.extras || []);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("¿Estás seguro de eliminar este ítem?")) return;
    try {
      await api.delete(`/business/items/${itemId}`);
      toast.success("Ítem eliminado");
      fetchData();
    } catch (err) {
      toast.error("Error al eliminar ítem");
    }
  };
  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{business.name}</h1>
            <nav className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
              {['main', 'orders', 'posts', 'profile'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === tab ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>
                  {tab === 'main' ? 'Inventario' : tab === 'orders' ? 'Pedidos' : tab === 'posts' ? 'Muro' : 'Perfil'}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsPostModalOpen(true)} className="flex-1 md:flex-none bg-slate-100 text-slate-900 font-black text-xs uppercase px-6 py-3 rounded-2xl border border-slate-200"><Camera size={18} className="inline mr-2" /> Post</button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-orange-500 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-lg"><Plus size={18} className="inline mr-2" /> Item</button>
          </div>
        </div>

        {activeTab === 'orders' ? <OrdersDashboard /> :
          activeTab === 'posts' ? <PostsView posts={posts} onDelete={() => { }} /> :
            activeTab === 'profile' ? <ConfigBusiness /> : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Créditos de Pedidos</p>
                    <p className="text-4xl font-black text-emerald-500 italic">${business.wallet?.balance || 0}</p>
                  </div>
                  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Catálogo Activo</p>
                    <p className="text-4xl font-black italic text-slate-900">{totalItems} <span className="text-sm not-italic opacity-30">ITEMS</span></p>
                  </div>
                </div>

                {/* TABLA Y PAGINACIÓN */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Producto</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center tracking-widest">Opciones</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          // SKELETON LOADING
                          [...Array(limit)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="px-8 py-6 flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
                                <div className="space-y-2">
                                  <div className="h-4 w-32 bg-slate-100 rounded" />
                                  <div className="h-3 w-16 bg-slate-100 rounded" />
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center"><div className="h-4 w-20 bg-slate-50 rounded mx-auto" /></td>
                              <td className="px-8 py-6"><div className="h-10 w-24 bg-slate-50 rounded-2xl ml-auto" /></td>
                            </tr>
                          ))
                        ) : items.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="py-20 text-center font-black opacity-20 uppercase italic tracking-widest">
                              No hay productos en esta página
                            </td>
                          </tr>
                        ) : (
                          items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-8 py-6 flex items-center gap-4">
                                <img src={item.image_url} className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shadow-sm border border-slate-100" alt="" />
                                <div>
                                  <p className="font-bold text-slate-800 text-lg leading-none">{item.name}</p>
                                  <p className="text-teal-500 font-black text-sm mt-1">${item.price}</p>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="flex justify-center gap-1">
                                  <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase">V: {item.variants?.length || 0}</span>
                                  <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase">E: {item.extras?.length || 0}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openEdit(item)} className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all hover:scale-110"><Pencil size={18} /></button>
                                  <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 rounded-2xl transition-all hover:scale-110"><Trash2 size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* CONTROLES DE PAGINACIÓN */}
                  <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Página {currentPage + 1} de {Math.ceil(totalItems / limit) || 1} — Total: {totalItems} items
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0 || loading}
                        className={`p-3 rounded-2xl border-2 transition-all ${currentPage === 0
                          ? 'border-transparent text-slate-200 cursor-not-allowed'
                          : 'border-white bg-white text-slate-900 shadow-sm hover:border-teal-500 active:scale-90'
                          }`}
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="flex gap-1">
                        {[...Array(Math.ceil(totalItems / limit))].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i
                              ? 'bg-slate-900 text-white shadow-lg scale-110'
                              : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-100'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={(currentPage + 1) * limit >= totalItems || loading}
                        className={`p-3 rounded-2xl border-2 transition-all ${(currentPage + 1) * limit >= totalItems
                          ? 'border-transparent text-slate-200 cursor-not-allowed'
                          : 'border-white bg-white text-slate-900 shadow-sm hover:border-teal-500 active:scale-90'
                          }`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* MODAL PRODUCTO COMPLETO */}
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
                {/* Nombre y Descripción */}
                <div className="col-span-2 space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre del producto o servicio"
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900 transition-all"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Descripción (ej: Materiales, ingredientes o detalles del servicio...)"
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900 transition-all min-h-[100px] resize-none"
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>

                {/* Precio y Switch de Servicio */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Precio Base</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                    <input type="number" className="w-full p-4 pl-8 bg-slate-50 rounded-2xl font-bold outline-none" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="relative inline-flex items-center cursor-pointer bg-slate-50 p-4 rounded-2xl border-2 border-transparent hover:border-slate-100 transition-all">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newProduct.is_service}
                      onChange={e => setNewProduct({ ...newProduct, is_service: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[22px] after:left-[20px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                    <span className="ml-3 text-[10px] font-black uppercase text-slate-500 tracking-tighter">¿Es Servicio?</span>
                  </label>
                </div>
              </div>

              {/* Gestores de Variantes y Extras */}
              <div className="grid grid-cols-1 gap-4">
                <ProductOptionsManager title="Variantes (Tamaños/Tipos)" options={variants} setOptions={setVariants} type="variant" />
                <ProductOptionsManager title="Extras (Adicionales)" options={extras} setOptions={setExtras} type="extra" />
              </div>

              {/* Carga de Imagen */}
              <label className="block p-4 bg-slate-900 text-white rounded-[2rem] border-2 border-dashed border-slate-700 text-center cursor-pointer hover:bg-black transition-all group">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon size={18} className={file ? "text-teal-400" : "text-slate-500 group-hover:text-white"} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    {file ? file.name : "Subir Foto del Producto"}
                  </span>
                </div>
              </label>

              {/* Botón de Acción */}
              <button type="submit" className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                {isEditing ? "Actualizar cambios" : "Publicar en catálogo"}
                <CheckCircle size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;