import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  LayoutDashboard, Package, ShoppingBag, Plus, Trash2, 
  X, Pencil, Camera, Grid3X3, Heart, ExternalLink, 
  Image as ImageIcon, MapPin, User, DollarSign, CheckCircle, XCircle, FileText, Loader2, Minus, Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- COMPONENTE INTERNO: GESTIÓN DE ÓRDENES ---
const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
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
              {order.appointment_datetime && (
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><Calendar size={18}/></div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-orange-600 leading-none mb-1">Cita</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(order.appointment_datetime).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {order.notes && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-900"><FileText size={18}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Notas</p>
                    <p className="text-xs font-medium text-slate-500 italic">"{order.notes}"</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><DollarSign size={18}/></div>
                <p className="text-xl font-black text-slate-900">${order.total_amount?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-dashed border-slate-100">
              {order.status === 'pending' ? (
                <>
                  <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                    <CheckCircle size={16}/> Completar
                  </button>
                  <button onClick={() => updateStatus(order.id, 'cancelled')} className="bg-slate-100 text-slate-400 p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors">
                    <XCircle size={20}/>
                  </button>
                </>
              ) : (
                <button onClick={() => updateStatus(order.id, 'pending')} className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-slate-100 transition-colors">
                  Reabrir Ticket
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {orders.length === 0 && (
        <div className="text-center py-20 border-4 border-dashed border-slate-100 rounded-[48px]">
          <ShoppingBag size={48} className="mx-auto text-slate-200 mb-2"/>
          <p className="text-slate-400 font-bold uppercase tracking-widest italic text-sm">No hay pedidos pendientes</p>
        </div>
      )}
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

  // Modales y Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', is_service: false, stock: 0, description: '' });
  const [postContent, setPostContent] = useState("");
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, meRes] = await Promise.all([
        api.get('/business/items'),
        api.get('/business/me')
      ]);
      setItems(itemsRes.data.items);
      setBusiness(meRes.data);
      try {
        const postsRes = await api.get('/social/my-posts');
        setPosts(postsRes.data);
      } catch (e) { setPosts([]); }
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally { setLoading(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("is_service", newProduct.is_service);
    formData.append("stock", newProduct.stock);
    formData.append("description", newProduct.description);
    
    // IMPORTANTE: Solo mandamos la imagen si el usuario eligió una nueva
    if (file) {
      formData.append("image", file);
    }

    try {
      if (isEditing) {
        await api.put(`/business/items/${editingItem.id}`, formData);
      } else {
        if (!file) return toast.error("La foto es obligatoria para nuevos productos");
        await api.post("/business/items", formData);
      }
      toast.success(isEditing ? "¡Actualizado!" : "¡Producto Creado!");
      resetForm();
      fetchData();
    } catch (err) { 
      toast.error("Error en la operación"); 
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try {
      await api.delete(`/business/items/${id}`);
      setItems(items.filter(i => i.id !== id));
      toast.success("Eliminado");
    } catch (err) { toast.error("Error al eliminar"); }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("La foto es obligatoria");
    const formData = new FormData();
    formData.append("content", postContent);
    formData.append("image", file);
    try {
      await api.post("/social/posts", formData);
      toast.success("¡Publicado!");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error al publicar"); }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("¿Borrar post?")) return;
    try {
      await api.delete(`/social/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
      toast.success("Borrado");
    } catch (err) { toast.error("Error"); }
  };

  const resetForm = () => {
    setIsModalOpen(false); 
    setIsPostModalOpen(false); 
    setIsEditing(false);
    setEditingItem(null); 
    setNewProduct({ name: '', price: '', is_service: false, stock: 0, description: '' });
    setPostContent(""); 
    setFile(null);
  };

  if (loading) return <div className="p-20 text-center font-black text-orange-500 animate-pulse uppercase italic tracking-tighter text-4xl">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SUPERIOR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              {business.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Dashboard</span>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab(activeTab === 'main' ? 'orders' : 'main')}
              className={`flex-1 md:flex-none py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                activeTab === 'orders' ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-white text-slate-900 border-slate-100 hover:border-slate-900'
              }`}
            >
              <ShoppingBag size={18} /> {activeTab === 'orders' ? 'Volver' : 'Pedidos'}
            </button>
            <button onClick={() => { resetForm(); setIsPostModalOpen(true); }} className="flex-1 md:flex-none bg-white border-2 border-slate-100 text-slate-900 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl hover:border-slate-900 transition-all flex items-center justify-center gap-2">
              <Camera size={18} /> Post
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-orange-500 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
              <Plus size={18} /> Item
            </button>
          </div>
        </div>

        {activeTab === 'orders' ? (
          <OrdersView />
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Créditos Wallet</p>
                 <p className="text-4xl font-black text-emerald-500 italic">{business.wallet?.balance || 0}</p>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Productos</p>
                 <p className="text-4xl font-black italic">{items.length}</p>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Publicaciones</p>
                 <p className="text-4xl font-black italic">{posts.length}</p>
              </div>
            </div>

            {/* MURO SOCIAL PREVIEW */}
            <div className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-slate-400 flex items-center gap-2">
                <Grid3X3 size={14}/> Feed de Novedades
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {posts.map(post => (
                  <div key={post.id} className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100">
                    <img src={post.image_url} className="w-full h-full object-cover" alt=""/>
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <button onClick={() => handleDeletePost(post.id)} className="bg-red-500 text-white p-3 rounded-2xl transform scale-50 group-hover:scale-100 transition-all"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GESTIÓN DE INVENTARIO RESPONSIVA */}
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-slate-400 flex items-center gap-2 px-4 md:px-0">
                <Package size={14}/> Gestión de Inventario
              </h2>
              
              <div className="bg-white md:rounded-[2rem] md:border border-slate-100 md:shadow-xl overflow-hidden">
                {/* TABLA DESKTOP */}
                <table className="w-full text-left hidden md:table">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Descripción</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Stock</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4 flex items-center gap-4">
                          <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-slate-100" alt=""/>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{item.name}</p>
                            <p className="text-orange-500 font-black text-xs mt-1">${item.price}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                          {item.description || <span className="italic opacity-40">Sin descripción</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg border ${
                            item.stock > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {item.stock} UN.
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditingItem(item); setNewProduct(item); setIsEditing(true); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Pencil size={18}/></button>
                            <button onClick={() => handleDeleteProduct(item.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* VISTA MÓVIL (CARDS) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-4">
                        <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shadow-sm" alt=""/>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-900 text-sm uppercase">{item.name}</h3>
                            <span className="font-black text-orange-600">${item.price}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mb-2 italic">
                            {item.description || "Sin descripción"}
                          </p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            item.stock > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            DISPONIBLE: {item.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(item); setNewProduct(item); setIsEditing(true); setIsModalOpen(true); }} className="flex-1 bg-slate-50 text-slate-700 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:bg-slate-200 transition-colors">
                          <Pencil size={14}/> Editar
                        </button>
                        <button onClick={() => handleDeleteProduct(item.id)} className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:bg-red-100 transition-colors">
                          <Trash2 size={14}/> Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODAL PRODUCTO (Mejorado con Preview) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{isEditing ? "Editar" : "Nuevo"} Item</h2>
              <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre del producto" required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Precio ($)" required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                <input type="number" placeholder="Stock" required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>

              <textarea placeholder="Descripción corta..." className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-medium h-24 resize-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />

              <div className="flex items-center gap-3 p-2">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-200 text-orange-500 focus:ring-orange-500" id="is_service" checked={newProduct.is_service} onChange={e => setNewProduct({...newProduct, is_service: e.target.checked})} />
                <label htmlFor="is_service" className="text-xs font-black uppercase text-slate-500">¿Es un servicio / cita?</label>
              </div>

              {/* LÓGICA DE IMAGEN: Si no selecciona, mantiene la actual */}
              <label className="block bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                
                {file ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-orange-500 uppercase">Nueva foto lista:</p>
                    <span className="text-xs font-bold text-slate-600 truncate block">{file.name}</span>
                  </div>
                ) : isEditing && editingItem?.image_url ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={editingItem.image_url} className="w-12 h-12 rounded-lg object-cover mx-auto shadow-sm" alt="" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Click para cambiar imagen</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={32} className="mx-auto mb-2 text-slate-300" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subir Imagen</span>
                  </>
                )}
              </label>

              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-[4px] hover:bg-black transition-all shadow-xl shadow-slate-200">
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Post */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Nuevo Post</h2>
              <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={28}/></button>
            </div>
            <form onSubmit={handlePostSubmit} className="space-y-5">
              <textarea placeholder="¿Qué hay de nuevo?" required className="w-full p-6 bg-slate-50 rounded-3xl border-none focus:ring-2 ring-slate-900 font-medium h-32 resize-none" value={postContent} onChange={e => setPostContent(e.target.value)} />
              <label className="block bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-all">
                <input type="file" required onChange={e => setFile(e.target.files[0])} className="hidden" />
                <Camera size={32} className="mx-auto mb-2 text-slate-300" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{file ? file.name : "Seleccionar Foto"}</span>
              </label>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-[4px] hover:bg-black transition-all">Publicar ahora</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;