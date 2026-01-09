import React from 'react';
import { Plus, Minus, Heart, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const PublicCatalog = ({
  activeTab,
  data,
  cart,
  updateQuantity,
  handleLike,
  likedPosts,
  isloading,
  // Props de paginación
  currentPage,
  setCurrentPage,
  totalItems
}) => {
  const itemsPerPage = 5;
  if (isloading && data.items.length === 0 && !inputValue) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white opacity-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  // VISTA DE PRODUCTOS (MENÚ)
  if (activeTab === 'menu') {
    if (data.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Search size={40} className="text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-800 uppercase text-sm">Sin coincidencias</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            No encontramos productos que coincidan con tu búsqueda.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3 animate-in fade-in duration-300">
        {data.items.map(item => {
          const currentQty = cart[item.id] || 0;
          const hasReachedLimit = currentQty >= item.stock;
          const isOutOfStock = item.stock <= 0;

          return (
            <div key={item.id} className={`flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm transition-opacity ${isOutOfStock ? 'opacity-60' : ''}`}>

              {/* Imagen con badge de stock */}
              <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <img src={item.image_url} className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale' : ''}`} alt={item.name} />
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-[10px] font-black text-white uppercase">Agotado</span>
                  </div>
                )}
              </div>

              {/* Info Producto */}
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm uppercase leading-tight">{item.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold">{item.description}</p>
                <p className="text-orange-600 font-black text-lg">${item.price}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  {isOutOfStock ? 'No disponible' : `Stock: ${item.stock}`}
                </p>
              </div>

              {/* Controles de Carrito */}
              {!cart[item.id] ? (
                <button
                  disabled={isOutOfStock}
                  onClick={() => updateQuantity(item.id, 1)}
                  className={`p-4 rounded-xl ${isOutOfStock ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-900 active:bg-slate-200'}`}
                >
                  <Plus size={18} />
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-900 text-white p-1 rounded-xl">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-2"><Minus size={14} /></button>
                  <span className="font-black text-sm w-4 text-center">{currentQty}</span>
                  <button
                    disabled={hasReachedLimit}
                    onClick={() => updateQuantity(item.id, 1)}
                    className={`p-2 ${hasReachedLimit ? 'text-slate-600' : 'text-white'}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        <div className="flex items-center justify-between pt-6 pb-8 border-t border-slate-50 mt-4">
          <button
            disabled={currentPage === 0}
            onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest disabled:opacity-20"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <span className="text-[10px] font-black bg-slate-100 px-4 py-1.5 rounded-full">
            {currentPage + 1}
          </span>

          <button
            disabled={(currentPage + 1) * itemsPerPage >= totalItems}
            onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest disabled:opacity-20"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 animate-in fade-in duration-300">
      {data.posts.map(post => (
        <div key={post.id} className="bg-white border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2 p-4">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-[8px] text-white font-black italic">
              {data.business?.name.charAt(0)}
            </div>
            <span className="font-bold text-[10px] uppercase italic tracking-tight">{data.business?.name}</span>
          </div>

          {/* Contenedor de imagen tipo Instagram para la Galería */}
          <div className="w-full aspect-square overflow-hidden bg-slate-50">
            <img
              src={post.image_url}
              className="w-full h-full object-cover cursor-pointer select-none"
              alt=""
              onDoubleClick={() => handleLike(post.id)}
            />
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start gap-4">
              {/* 1. Lado Izquierdo: El contenido del post */}
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-slate-700 font-medium">
                  {post.content}
                </p>
              </div>

              {/* 2. Lado Derecho: Interacciones (Icono + Conteo) */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleLike(post.id)}
                  className="transition-transform active:scale-125"
                >
                  <Heart
                    size={24}
                    className={`transition-all ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : 'text-slate-900'
                      }`}
                  />
                </button>

                <span className="font-black text-[10px] whitespace-nowrap uppercase tracking-tighter">
                  {post.likes_count || 0} {post.likes_count === 1 ? 'Like' : 'Likes'}
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