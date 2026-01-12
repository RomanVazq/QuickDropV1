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
        <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-slate-200" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase">Sin resultados</p>
        </div>
      );
    }

    return (
      <div className="p-5 space-y-4 max-w-2xl mx-auto pb-32 animate-in fade-in duration-500">
        {data.items.map(item => {
          const currentQty = cart[item.id] || 0;
          const isOutOfStock = !item.is_service && item.stock <= 0;

          return (
            <div 
              key={item.id} 
              className={`group bg-white rounded-[2.5rem] p-4 flex gap-5 border-2 border-slate-100 transition-all duration-300 hover:border-teal-500/30 hover:shadow-xl hover:shadow-slate-200/50 ${isOutOfStock ? 'opacity-50' : ''}`}
            >
              {/* IMAGEN: Enmarcada sutilmente */}
              <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-[1.8rem] bg-slate-50 border border-slate-100">
                <img 
                  src={item.image_url || 'https://via.placeholder.com/150'} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  alt={item.name} 
                />
                {item.is_service && (
                   <div className="absolute top-2 left-2 bg-teal-500 px-2 py-0.5 rounded-full border border-white shadow-sm">
                    <span className="text-[7px] font-black text-white uppercase tracking-tighter">Servicio</span>
                  </div>
                )}
              </div>

              {/* CONTENIDO */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 mt-1 uppercase tracking-tight">
                    {item.description || "Calidad y detalle en cada pedido."}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-black text-slate-900 italic">
                    ${item.price}
                  </span>

                  {/* CONTROL DE CANTIDAD */}
                  {!cart[item.id] ? (
                    <button
                      disabled={isOutOfStock}
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 transition-all active:scale-95 disabled:bg-slate-50 disabled:text-slate-200"
                    >
                      Añadir
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-900 p-1 rounded-2xl border-2 border-slate-900 shadow-lg shadow-slate-200">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-white hover:text-red-400 transition-colors"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="text-xs font-black text-white min-w-[12px] text-center">{currentQty}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={!item.is_service && currentQty >= item.stock}
                        className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-white hover:text-teal-400 transition-colors disabled:opacity-30"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* PAGINACIÓN CON CONTORNOS */}
        <div className="flex justify-center items-center py-10 gap-3">
          <button
            onClick={() => { setCurrentPage(prev => Math.max(0, prev - 1)); window.scrollTo(0,0); }}
            disabled={currentPage === 0}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-slate-400 disabled:opacity-0 transition-all hover:border-slate-900 hover:text-slate-900"
          >
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          
          <div className="border-2 border-slate-100 px-5 py-1.5 rounded-2xl bg-white">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
              {currentPage + 1}
            </span>
          </div>

          <button
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
            disabled={(currentPage + 1) * itemsPerPage >= totalItems}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-slate-400 disabled:opacity-0 transition-all hover:border-slate-900 hover:text-slate-900"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA DE MURO (SOCIAL POSTS) ---
 return (
    <div className="max-w-2xl mx-auto space-y-10 py-6 animate-in fade-in duration-500 pb-32 px-4">
      {data.posts && data.posts.map(post => (
        <div 
          key={post.id} 
          className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-all hover:border-slate-200"
        >
          {/* Header del Post: Elegante y minimalista */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-[12px] text-white font-black italic border-2 border-slate-900 shadow-sm rotate-3">
                {data.business?.logo_url ? (
                  <img 
                    src={data.business.logo_url}
                    alt="Logo del negocio"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  data.business?.name?.charAt(0)
                )}
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-tighter text-slate-900">
                  {data.business?.name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Publicado recientemente
                </p>
              </div>
            </div>
          </div>

          {/* Imagen del Post: Con bordes internos suavizados */}
          <div className="px-5">
            <div className="aspect-square overflow-hidden rounded-[2rem] bg-slate-50 border border-slate-100 relative group">
              <img
                src={post.image_url}
                className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                alt=""
                onDoubleClick={() => handleLike(post.id)}
              />
              {/* Overlay de Like (Doble Tap) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-active:opacity-100 transition-opacity">
                 <Heart size={80} className="text-white fill-white drop-shadow-2xl" />
              </div>
            </div>
          </div>

          {/* Footer e Interacciones */}
          <div className="p-6">
            <div className="flex justify-between items-start gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-relaxed text-slate-600 font-medium italic">
                   {post.content}
                </p>
              </div>

              {/* Botón de Like Estilo Cápsula */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`p-4 rounded-2xl border-2 transition-all active:scale-125 ${
                    likedPosts.has(post.id) 
                    ? 'bg-red-50 border-red-100 text-red-500 shadow-lg shadow-red-100' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 hover:border-slate-900'
                  }`}
                >
                  <Heart 
                    size={22} 
                    strokeWidth={3} 
                    className={likedPosts.has(post.id) ? 'fill-current' : ''} 
                  />
                </button>
                <span className="font-black text-[10px] uppercase tracking-widest mt-2 text-slate-900">
                  {post.likes_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicCatalog;