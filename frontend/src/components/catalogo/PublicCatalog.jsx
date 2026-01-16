import React from 'react';
import { Plus, Minus, Search, Zap, Package, ChevronLeft, ChevronRight, ImageIcon, Heart, NotebookPenIcon } from 'lucide-react';
import { PublicPosts } from './PublicPosts';

const PublicCatalog = ({
  activeTab,
  data,
  cart,
  updateQuantity,
  isloading,
  currentPage,
  setCurrentPage,
  totalItems,
  handleLike,
  likedPosts,
  setIsDetailModalOpen,
  setSelectedItem
}) => {
  const itemsPerPage = 12;
  const services = data.items?.filter(item => item.is_service) || [];
  const products = data.items?.filter(item => !item.is_service) || [];

const renderItemCard = (item) => {
    const totalInCart = Object.keys(cart).reduce((total, key) => {
      if (key === item.id.toString() || key.startsWith(`${item.id}_`)) {
        return total + cart[key];
      }
      return total;
    }, 0);

    const isGeneralOutOfStock = !item.is_service && 
      (item.variants?.length > 0 ? item.variants.every(v => v.stock <= 0) : item.stock <= 0);

    const hasOptions = item.variants?.length > 0 || item.extras?.length > 0;

    return (
      <div 
        key={item.id} 
        onClick={() => {
          setSelectedItem(item);
          setIsDetailModalOpen(true);
        }}
        className={`group cursor-pointer bg-white rounded-[2rem] p-3 flex gap-4 border-2 border-slate-50 transition-all duration-300 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 ${isGeneralOutOfStock ? 'opacity-50' : ''}`}
      >
        {/* Imagen */}
        <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-[1.5rem] bg-slate-100 border border-slate-50">
          <img src={item.image_url  } className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
          {item.is_service && (
            <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-lg">
              <NotebookPenIcon size={10} className="text-orange-400 fill-white" />
            </div>
          )}
        </div>

        {/* Info y Acciones */}
        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
          <div>
            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate">{item.name}</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase line-clamp-2 mt-0.5 leading-tight">
              {item.description || "Calidad y detalle garantizado"}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-base font-black text-slate-900 italic tracking-tighter">${item.price}</span>

            {totalInCart === 0 ? (
              <button
                disabled={isGeneralOutOfStock}
                onClick={(e) => {
                  e.stopPropagation(); // Evita que se abra el modal
                  updateQuantity(item.id, 1);
                }}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:bg-slate-100 disabled:text-slate-300"
              >
                {isGeneralOutOfStock ? 'Agotado' : (item.is_service ? 'Agendar' : 'Añadir')}
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2.5 bg-slate-900 p-1 rounded-2xl shadow-lg shadow-slate-200">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se abra el modal
                      const keys = Object.keys(cart).filter(k => k === item.id.toString() || k.startsWith(`${item.id}_`));
                      updateQuantity(keys[keys.length - 1], -1);
                    }} 
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-white hover:text-red-400 transition-colors"
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="text-xs font-black text-white min-w-[12px] text-center">{totalInCart}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se abra el modal
                      updateQuantity(item.id, 1);
                    }}
                    disabled={!item.is_service && isGeneralOutOfStock}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-white hover:text-teal-400 transition-colors disabled:opacity-30"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
                {hasOptions && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(item.id, 1);
                    }}
                    className="text-[8px] font-black uppercase text-slate-400 underline decoration-2 underline-offset-2 hover:text-slate-900 transition-colors"
                  >
                    + Configurar más
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isloading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Cargando...</p>
      </div>
    );
  }

  if (activeTab === 'menu') {
    return (
      <div className="p-4 space-y-10 pb-32 animate-in fade-in duration-500">
        {/* Sección Servicios */}
        {services.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <NotebookPenIcon size={14} className="text-orange-500" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Servicios</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">{services.map(renderItemCard)}</div>
          </div>
        )}

        {/* Sección Productos */}
        {products.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                <Package size={14} className="text-slate-400" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Productos</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">{products.map(renderItemCard)}</div>
          </div>
        )}

        {/* Sin resultados */}
        {data.items?.length === 0 && (
          <div className="py-20 flex flex-col items-center opacity-30">
            <Search size={40} className="mb-4 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest">No se encontraron resultados</p>
          </div>
        )}

        {/* Paginación */}
        {totalItems > itemsPerPage && (
          <div className="flex justify-center items-center py-10 gap-3">
            <button 
              onClick={() => { setCurrentPage(prev => Math.max(0, prev - 1)); window.scrollTo(0,0); }} 
              disabled={currentPage === 0} 
              className="p-3 bg-white border-2 border-slate-50 rounded-[1.2rem] text-slate-400 disabled:opacity-0 hover:border-slate-900 hover:text-slate-900 transition-all"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            <div className="bg-slate-900 text-white px-6 py-2.5 rounded-[1.2rem] text-[11px] font-black italic shadow-lg shadow-slate-200">
              {currentPage + 1}
            </div>
            <button 
              onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }} 
              disabled={(currentPage + 1) * itemsPerPage >= totalItems} 
              className="p-3 bg-white border-2 border-slate-50 rounded-[1.2rem] text-slate-400 disabled:opacity-0 hover:border-slate-900 hover:text-slate-900 transition-all"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Vista de Muro (Social Feed) - Manteniendo la lógica Instagram
  return <PublicPosts data={data} handleLike={handleLike} likedPosts={likedPosts} />;
};

export default PublicCatalog;