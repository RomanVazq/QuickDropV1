import React from 'react';
import { Plus, Minus, Heart, ChevronLeft, ChevronRight, Search, Image as ImageIcon } from 'lucide-react';

const PublicCatalog = ({
  activeTab,
  data,
  cart,
  updateQuantity,
  handleLike,
  likedPosts,
  isloading,
  inputValue,
  currentPage,
  setCurrentPage,
  totalItems
}) => {
  const itemsPerPage = 5;

  // Pantalla de carga inicial
  if (isloading && (!data.items || data.items.length === 0) && !inputValue) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Catálogo...</p>
      </div>
    );
  }

  // --- VISTA DE MENÚ (PRODUCTOS Y SERVICIOS) ---
  if (activeTab === 'menu') {
    if (!data.items || data.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Search size={40} className="text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-800 uppercase text-sm">Sin coincidencias</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">No hay productos disponibles en este momento.</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3 animate-in fade-in duration-300 pb-24">
        {data.items.map(item => {
          const currentQty = cart[item.id] || 0;
          // Lógica: Si es servicio, NO se agota. Si es producto, depende del stock.
          const isOutOfStock = !item.is_service && item.stock <= 0;
          const hasReachedLimit = !item.is_service && currentQty >= item.stock;

          return (
            <div key={item.id} className={`flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-[2rem] shadow-sm transition-all ${isOutOfStock ? 'opacity-50' : 'hover:border-slate-200'}`}>
              
              {/* Imagen con badges dinámicos */}
              <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-inner">
                <img 
                  src={item.image_url || 'https://via.placeholder.com/150'} 
                  className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale' : ''}`} 
                  alt={item.name} 
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Agotado</span>
                  </div>
                )}
                {item.is_service && (
                  <div className="absolute top-2 left-2 bg-teal-500 text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase shadow-lg">
                    Servicio
                  </div>
                )}
              </div>

              {/* Información del Item */}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-sm uppercase leading-tight truncate">{item.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                  {item.description || "Sin descripción disponible."}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-orange-600 font-black text-lg">${item.price}</span>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    {item.is_service ? '• Entrega Inmediata' : `• Stock: ${item.stock}`}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col items-center justify-center">
                {!cart[item.id] ? (
                  <button
                    disabled={isOutOfStock}
                    onClick={() => updateQuantity(item.id, 1)}
                    className={`p-4 rounded-2xl transition-all ${isOutOfStock ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white active:scale-90 shadow-md shadow-slate-200'}`}
                  >
                    <Plus size={20} />
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-1 bg-slate-900 text-white p-1 rounded-2xl animate-in zoom-in-95">
                    <button onClick={() => updateQuantity(item.id, 1)} disabled={hasReachedLimit} className={`p-2 ${hasReachedLimit ? 'text-slate-600' : 'text-white'}`}><Plus size={16} /></button>
                    <span className="font-black text-xs h-5 flex items-center justify-center">{currentQty}</span>
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-white/50 hover:text-white"><Minus size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Paginación */}
        <div className="flex justify-center items-center py-10 gap-2">
          <button
            onClick={() => { setCurrentPage(prev => Math.max(0, prev - 1)); window.scrollTo(0,0); }}
            disabled={currentPage === 0 || isloading}
            className="p-3 rounded-xl border border-slate-100 disabled:opacity-20 active:scale-90 transition-all bg-white shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex gap-1">
            {[...Array(Math.ceil(totalItems / itemsPerPage))].map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i); window.scrollTo(0,0); }}
                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
            disabled={(currentPage + 1) * itemsPerPage >= totalItems || isloading}
            className="p-3 rounded-xl border border-slate-100 disabled:opacity-20 active:scale-90 transition-all bg-white shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA DE MURO (SOCIAL POSTS) ---
  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-300 pb-24">
      {data.posts && data.posts.map(post => (
        <div key={post.id} className="bg-white group">
          {/* Header del Post */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-black italic shadow-lg">
              {data.business?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-black text-[11px] uppercase tracking-tighter text-slate-900">{data.business?.name}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Publicado recientemente</p>
            </div>
          </div>

          {/* Imagen del Post */}
          <div className="w-full aspect-square overflow-hidden bg-slate-50 relative">
            <img
              src={post.image_url}
              className="w-full h-full object-cover select-none"
              alt=""
              onDoubleClick={() => handleLike(post.id)}
            />
            {/* Overlay sutil al pasar el mouse (solo desktop) */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          {/* Footer del Post e Interacciones */}
          <div className="p-5">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-slate-800 font-medium">
                  {post.content}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`p-3 rounded-full transition-all active:scale-150 ${likedPosts.has(post.id) ? 'text-red-500 bg-red-50' : 'text-slate-900 bg-slate-50'}`}
                >
                  <Heart size={24} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                </button>
                <span className="font-black text-[9px] uppercase tracking-tighter mt-1 text-slate-400">
                  {post.likes_count || 0} Likes
                </span>
              </div>
            </div>
          </div>
          <div className="h-[1px] bg-slate-50 mx-4" />
        </div>
      ))}
    </div>
  );
};

export default PublicCatalog;