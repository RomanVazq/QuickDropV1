import React from 'react';
import { Plus, Minus, Heart } from 'lucide-react';

const PublicCatalog = ({ 
  activeTab, 
  data, 
  cart, 
  updateQuantity, 
  handleLike, 
  likedPosts 
}) => {
  if (activeTab === 'menu') {
    return (
      <div className="p-4 space-y-3 animate-in fade-in duration-300">
        {data.items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <img src={item.image_url} className="w-20 h-20 rounded-xl object-cover" alt="" />
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 text-sm uppercase leading-tight">{item.name}</h3>
              <p className="text-orange-600 font-black text-lg">${item.price}</p>
            </div>
            {!cart[item.id] ? (
              <button onClick={() => updateQuantity(item.id, 1)} className="bg-slate-50 p-4 rounded-xl text-slate-900 transition-all active:bg-slate-200">
                <Plus size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900 text-white p-1 rounded-xl">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:text-orange-400"><Minus size={14}/></button>
                <span className="font-black text-sm w-4 text-center">{cart[item.id]}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:text-orange-400"><Plus size={14}/></button>
              </div>
            )}
          </div>
        ))}
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
          <img 
            src={post.image_url} 
            className="w-full aspect-square object-cover cursor-pointer" 
            alt="" 
            onDoubleClick={() => handleLike(post.id)} 
          />
          <div className="p-4">
            <p className="text-md mb-2 font-black">
              <span className='font-red  mr-2'>{post.content}</span>
            </p>
            <div className="flex items-center gap-4 mb-2">

              <button onClick={() => handleLike(post.id)} className="transition-transform active:scale-125">
                <Heart 
                  size={28} 
                  className={`transition-all ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : 'text-slate-900'}`} 
                />
              </button>
            </div>
            <p className="font-black text-sm mb-1">{post.likes_count || 0} Me gusta</p>

          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicCatalog;