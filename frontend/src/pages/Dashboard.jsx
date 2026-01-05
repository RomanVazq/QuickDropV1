import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Package, ShoppingBag, Plus, Trash2, X, Pencil, Camera, 
  Grid3X3, Heart, Image as ImageIcon, MapPin, User, 
  DollarSign, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight,
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
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
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

// --- COMPONENTE INTERNO: GESTIÓN DE ÓRDENES ---
const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      const ordersData = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setOrders(ordersData);
    } catch (err) {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status?status=${newStatus}`);
      toast.success("Estado actualizado");
      fetchOrders();
    } catch (err) {
      toast.error("No se pudo actualizar");
    }
  };

  if (loading) return <div className="py-20 text-center font-black animate-pulse uppercase italic text-slate-400 text-sm tracking-widest">Consultando tickets...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white border-2 border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all border-t-8 border-t-slate-900">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                {order.status}
              </span>
              <span className="text-slate-400 text-[10px] font-bold">#{order.id.substring(0, 8)}</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><User size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Cliente</p>
                  <p className="font-bold text-slate-900 leading-tight">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><MapPin size={18}/></div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Dirección</p>
                  <p className="text-sm font-medium text-slate-600 line-clamp-1">{order.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><DollarSign size={18}/></div>
                <p className="text-xl font-black text-slate-900">${order.total_amount?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-dashed border-slate-100">
              {order.status === 'pending' ? (
                <button onClick={() => updateStatus(order.id, 'completed')} className="w-full bg-green-500 text-white py-3 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600">
                  <CheckCircle size={16}/> Completar
                </button>
              ) : (
                <button onClick={() => updateStatus(order.id, 'pending')} className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-slate-100">
                  Reabrir Ticket
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DASHBOARD PRINCIPAL ---
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('main'); // main, orders, posts
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [business, setBusiness] = useState({ name: '', slug: '', wallet: { balance: 0 } });
  const [loading, setLoading] = useState(true);

  // Paginación Inventario
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: 0, description: '' });
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
    } finally { setLoading(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));
    if (file) formData.append("image", file);

    try {
      if (isEditing) await api.put(`/business/items/${editingItem.id}`, formData);
      else await api.post("/business/items", formData);
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
    setNewProduct({ name: '', price: '', stock: 0, description: '' });
    setPostContent(""); 
    setFile(null);
  };

  if (loading && items.length === 0) return <div className="p-20 text-center font-black text-slate-900 animate-pulse uppercase italic tracking-tighter text-4xl">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{business.name}</h1>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setActiveTab('main')} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === 'main' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>Inventario</button>
              <button onClick={() => setActiveTab('orders')} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>Pedidos</button>
              <button onClick={() => setActiveTab('posts')} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${activeTab === 'posts' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>Muro Social</button>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsPostModalOpen(true)} className="flex-1 md:flex-none bg-slate-100 text-slate-900 font-black text-xs uppercase px-6 py-3 rounded-2xl hover:bg-slate-200 flex items-center justify-center gap-2">
              <Camera size={18} /> Post
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-orange-500 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-lg hover:bg-orange-600 flex items-center justify-center gap-2">
              <Plus size={18} /> Item
            </button>
          </div>
        </div>

        {activeTab === 'orders' ? <OrdersView /> : 
         activeTab === 'posts' ? <PostsView posts={posts} onDelete={handleDeletePost} /> : (
          <>
            {/* STATS & INVENTARIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Créditos</p>
                 <p className="text-4xl font-black text-emerald-500 italic">{business.wallet?.balance || 0}</p>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Items</p>
                 <p className="text-4xl font-black italic">{totalItems}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500">Producto</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 text-center">Stock</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover" alt=""/>
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
              <div className="flex items-center justify-between p-6 bg-slate-50/50">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="text-[10px] font-black uppercase disabled:opacity-30"><ChevronLeft size={16}/></button>
                <span className="text-[10px] font-black">Página {currentPage + 1}</span>
                <button disabled={(currentPage + 1) * limit >= totalItems} onClick={() => setCurrentPage(p => p + 1)} className="text-[10px] font-black uppercase disabled:opacity-30"><ChevronRight size={16}/></button>
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
              <textarea placeholder="¿Qué quieres anunciar?" className="w-full p-4 bg-slate-50 rounded-2xl h-32 resize-none font-medium" value={postContent} onChange={e => setPostContent(e.target.value)} />
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
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase">{isEditing ? "Editar" : "Nuevo"} Item</h2>
              <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={28}/></button>
            </div>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Precio" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                <input type="number" placeholder="Stock" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <textarea placeholder="Descripción..." className="w-full p-4 bg-slate-50 rounded-2xl h-24 font-medium" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              <label className="block bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center cursor-pointer">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                <span className="text-[10px] font-black uppercase text-slate-400">{file ? file.name : "Foto del Producto"}</span>
              </label>
              <button type="submit" className="w-full bg-orange-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;