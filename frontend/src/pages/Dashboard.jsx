import React, { useState, useEffect } from 'react';
import api from '../services/api';
import OrdersDashboard from './OrdersDashboard';
import { 
  Package, ShoppingBag, Plus, Trash2, X, Pencil, Camera, 
  Grid3X3, Heart, Image as ImageIcon, MapPin, User, 
  DollarSign, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, Settings,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- COMPONENTE INTERNO: GESTIÓN DE POSTS ---
const PostsView = ({ posts, onDelete }) => {
  if (posts.length === 0) return <div className="py-20 text-center font-black opacity-20 uppercase italic tracking-widest">No hay publicaciones aún</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 group">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            )}
            <button 
              onClick={() => onDelete(post.id)}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-red-500 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4 line-clamp-3">
              {post.content}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs"><Heart size={14} /> {post.likes_count || 0}</span>
                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs"><MessageSquare size={14} /> {post.comments_count || 0}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
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
      toast.error("Error al cargar datos");
      if (err.response?.status === 401) {
        toast.error("Por favor, inicia sesión nuevamente");
        window.location.href = '/login';
      }
    } finally { setLoading(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));
    if (file) formData.append("image", file);

    try {
      if (isEditing) await api.put(`/business/items/${editingItem.id}`, formData);
      else {
        if (!file) return toast.error("La imagen es obligatoria");
        await api.post("/business/items", formData);
      }
      toast.success("¡Éxito!");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error en la operación"); }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent && !file) return;
    const formData = new FormData();
    formData.append("content", postContent);
    if (file) formData.append("image", file);

    try {
      await api.post("/social/posts", formData);
      toast.success("Publicado en el muro");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error al publicar"); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try {
      await api.delete(`/business/items/${id}`);
      fetchData();
      toast.success("Eliminado");
    } catch (err) { toast.error("Error"); }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("¿Eliminar post?")) return;
    try {
      await api.delete(`/social/posts/${id}`);
      fetchData();
      toast.success("Eliminado");
    } catch (err) { toast.error("Error"); }
  };

  const resetForm = () => {
    setIsModalOpen(false); 
    setIsPostModalOpen(false); 
    setIsEditing(false);
    setEditingItem(null);
    setNewProduct({ name: '', price: '', stock: 0, description: '', is_service: false });
    setPostContent(""); 
    setFile(null);
  };

  if (loading && items.length === 0) return <div className="p-20 text-center font-black text-slate-900 animate-pulse uppercase italic tracking-tighter text-4xl">Cargando</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{business.name}</h1>
            <div className="flex overflow-x-auto gap-2 mt-4 no-scrollbar pb-2">
              <button onClick={() => setActiveTab('main')} className={`whitespace-nowrap text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === 'main' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>Inventario</button>
              <button onClick={() => setActiveTab('orders')} className={`whitespace-nowrap text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>Pedidos</button>
              <button onClick={() => setActiveTab('posts')} className={`whitespace-nowrap text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === 'posts' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>Muro</button>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsPostModalOpen(true)} className="flex-1 md:flex-none bg-slate-100 text-slate-900 font-black text-xs uppercase px-6 py-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-200">
              <Camera size={18} /> Post
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-orange-500 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2">
              <Plus size={18} /> Item
            </button>
          </div>
        </div>

        {activeTab === 'orders' ? <OrdersDashboard /> : 
         activeTab === 'posts' ? <PostsView posts={posts} onDelete={handleDeletePost} /> : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
              <div className="bg-white p-6 md:p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Créditos</p>
                 <p className="text-3xl md:text-4xl font-black text-emerald-500 italic">${business.wallet?.balance || 0}</p>
              </div>
              <div className="bg-white p-6 md:p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Items</p>
                 <p className="text-3xl md:text-4xl font-black italic">{totalItems}</p>
              </div>
            </div>

            {/* TABLA RESPONSIVE */}
            <div className="bg-white rounded-[2rem] md:border border-slate-100 md:shadow-xl overflow-hidden">
              {/* VISTA MÓVIL (CARDS) */}
              <div className="md:hidden space-y-4 p-2">
                {items.map(item => (
                  <div key={item.id} className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-4">
                    <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-50" alt=""/>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                      <p className="text-orange-500 font-black text-sm">${item.price}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Stock: {item.stock}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setEditingItem(item); setNewProduct(item); setIsEditing(true); setIsModalOpen(true); }} className="p-2 text-slate-400 bg-slate-50 rounded-xl"><Pencil size={18}/></button>
                      <button onClick={() => handleDeleteProduct(item.id)} className="p-2 text-red-400 bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA DESKTOP (TABLE) */}
              <table className="w-full text-left hidden md:table">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Producto</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 text-center tracking-widest">Stock</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 text-right tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover bg-slate-100" alt=""/>
                        <div>
                          <p className="font-bold text-slate-800 leading-none">{item.name}</p>
                          <p className="text-orange-500 font-black text-xs mt-1">${item.price}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-slate-100">{item.stock} UN.</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingItem(item); setNewProduct(item); setIsEditing(true); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-slate-900"><Pencil size={18}/></button>
                          <button onClick={() => handleDeleteProduct(item.id)} className="p-2 text-slate-300 hover:text-red-600"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINACIÓN */}
              <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t border-slate-100">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30"><ChevronLeft size={16}/> Anterior</button>
                <span className="text-[10px] font-black bg-white px-4 py-2 rounded-xl border border-slate-200">Pág. {currentPage + 1}</span>
                <button disabled={(currentPage + 1) * limit >= totalItems} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Siguiente <ChevronRight size={16}/></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL POST */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">Nuevo Post</h2>
              <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={28}/></button>
            </div>
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <textarea placeholder="¿Qué quieres anunciar?" className="w-full p-4 bg-slate-50 rounded-2xl h-32 resize-none font-medium outline-none" value={postContent} onChange={e => setPostContent(e.target.value)} />
              <label className="block bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center cursor-pointer">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                <ImageIcon size={24} className="mx-auto mb-1 text-slate-300" />
                <span className="text-[10px] font-black uppercase text-slate-400">{file ? file.name : "Subir Imagen"}</span>
              </label>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all">Publicar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO */}
{isModalOpen && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full animate-in zoom-in-95 shadow-2xl max-h-[95vh] flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-slate-900">
            {isEditing ? "Editar" : "Nuevo"} Item
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración de producto</p>
        </div>
        <button 
          onClick={resetForm} 
          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
        >
          <X size={24}/>
        </button>
      </div>

      {/* FORMULARIO CON SCROLL */}
      <form onSubmit={handleProductSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre del producto</label>
          <input 
            type="text" 
            placeholder="Ej. Corte de Cabello" 
            required 
            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl font-bold outline-none transition-all" 
            value={newProduct.name} 
            onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Precio ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              required 
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl font-bold outline-none transition-all" 
              value={newProduct.price} 
              onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Stock</label>
            <input 
              type="number" 
              placeholder="99" 
              required 
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl font-bold outline-none transition-all" 
              value={newProduct.stock} 
              onChange={e => setNewProduct({...newProduct, stock: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descripción</label>
          <textarea 
            placeholder="Detalles del producto o servicio..." 
            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl h-24 font-medium outline-none transition-all resize-none" 
            value={newProduct.description} 
            onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
          />
        </div>

        {/* TOGGLE SERVICE */}
        <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${newProduct.is_service ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${newProduct.is_service ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Settings size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase">Es un servicio</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Habilita reserva de cita</p>
            </div>
          </div>
          <input 
            type="checkbox" 
            className="w-6 h-6 rounded-lg accent-orange-500"
            checked={newProduct.is_service} 
            onChange={e => setNewProduct({...newProduct, is_service: e.target.checked})} 
          />
        </label>

        {/* IMAGE UPLOAD */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Imagen</label>
          <label className="block bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:border-slate-900 transition-colors">
            <input 
              type="file" 
              onChange={e => setFile(e.target.files[0])} 
              className="hidden" 
              accept="image/*" 
            />
            <div className="flex flex-col items-center gap-1">
              <Camera size={20} className="text-slate-300" />
              <span className="text-[10px] font-black uppercase text-slate-500 truncate max-w-xs">
                {file ? file.name : "Subir o cambiar foto"}
              </span>
            </div>
          </label>
        </div>

        {/* SUBMIT */}
        <button 
          type="submit" 
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-orange-500 transition-all active:scale-95 shrink-0"
        >
          {isEditing ? "Actualizar" : "Guardar"} Item
        </button>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default Dashboard;