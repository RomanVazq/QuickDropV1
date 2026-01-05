import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LayoutDashboard, Package, ShoppingBag, Plus, Trash2, 
  X, Pencil, Camera, Grid3X3, Heart, ExternalLink, 
  Image as ImageIcon, MapPin, User, DollarSign, CheckCircle, XCircle, FileText, Loader2, Minus, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- COMPONENTE INTERNO: GESTIÓN DE ÓRDENES ---
const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      // Si el endpoint de órdenes también se pagina, usar res.data.items
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
              {order.appointment_datetime && (
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><Calendar size={18}/></div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-orange-600 leading-none mb-1">Cita</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(order.appointment_datetime).toLocaleString()}</p>
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

  // --- ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // Modales y Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', is_service: false, stock: 0, description: '' });
  const [postContent, setPostContent] = useState("");
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Carga de datos al iniciar o cambiar de página
  useEffect(() => { fetchData(); }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const skip = currentPage * limit;

      const [itemsRes, meRes] = await Promise.all([
        api.get(`/business/items?skip=${skip}&limit=${limit}`),
        api.get('/business/me')
      ]);
      
      // FIX: Acceder a .items y .total para evitar error .map()
      setItems(itemsRes.data.items || []);
      setTotalItems(itemsRes.data.total || 0);
      setBusiness(meRes.data);

      try {
        const postsRes = await api.get('/social/my-posts');
        // Blindaje para posts
        const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data.items || []);
        setPosts(postsData);
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
    if (file) formData.append("image", file);

    try {
      if (isEditing) {
        await api.put(`/business/items/${editingItem.id}`, formData);
      } else {
        if (!file) return toast.error("La foto es obligatoria");
        await api.post("/business/items", formData);
      }
      toast.success("¡Operación exitosa!");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error en la operación"); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try {
      await api.delete(`/business/items/${id}`);
      fetchData(); // Recargamos para que la paginación se ajuste
      toast.success("Eliminado");
    } catch (err) { toast.error("Error al eliminar"); }
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

  if (loading && items.length === 0) return <div className="p-20 text-center font-black text-slate-900 animate-pulse uppercase italic tracking-tighter text-4xl">Kyomi Loading...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              {business.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Admin Panel</span>
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
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-orange-500 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
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
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Productos</p>
                 <p className="text-4xl font-black italic">{totalItems}</p>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Página Actual</p>
                 <p className="text-4xl font-black italic">{currentPage + 1}</p>
              </div>
            </div>

            {/* TABLA DE INVENTARIO PAGINADA */}
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-slate-400 flex items-center gap-2">
                <Package size={14}/> Inventario ({totalItems})
              </h2>
              
              <div className="bg-white md:rounded-[2rem] md:border border-slate-100 shadow-xl overflow-hidden">
                <table className="w-full text-left hidden md:table">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Stock</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4 flex items-center gap-4">
                          <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover bg-slate-100" alt=""/>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{item.name}</p>
                            <p className="text-orange-500 font-black text-xs mt-1">${item.price}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-slate-100">
                            {item.stock} UN.
                          </span>
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

                {/* CONTROLES DE PAGINACIÓN */}
                <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t border-slate-100">
                  <button 
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:text-orange-500 transition-colors"
                  >
                    <ChevronLeft size={16}/> Anterior
                  </button>
                  
                  <span className="text-[10px] font-black bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                    Página {currentPage + 1}
                  </span>

                  <button 
                    disabled={(currentPage + 1) * limit >= totalItems}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:text-orange-500 transition-colors"
                  >
                    Siguiente <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL PRODUCTO  */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{isEditing ? "Editar" : "Nuevo"} Item</h2>
              <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre" required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Precio ($)" required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                <input type="number" placeholder="Stock" required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>

              <textarea placeholder="Descripción..." className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-medium h-24 resize-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />

              <label className="block bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-all">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" accept="image/*" />
                <ImageIcon size={24} className="mx-auto mb-1 text-slate-300" />
                <span className="text-[10px] font-black uppercase text-slate-400">{file ? file.name : "Subir Foto"}</span>
              </label>

              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-[4px] shadow-xl hover:bg-black transition-all">
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;