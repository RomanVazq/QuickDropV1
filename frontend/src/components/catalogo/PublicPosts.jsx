import React from "react";
import { Heart, ImageIcon } from "lucide-react";
export const PublicPosts = ({ data, handleLike, likedPosts }) => {
 
 return (
    <div className="p-4 space-y-10 pb-32 animate-in fade-in duration-700">
      {data.posts?.map(post => (
        <div key={post.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden group">
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-[1rem] overflow-hidden border border-slate-50">
               {data.business?.logo_url && <img src={data.business.logo_url} className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{data.business?.name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Publicado</p>
            </div>
          </div>
          <div className="aspect-square relative overflow-hidden mx-1 rounded-[2rem]">
            <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" onDoubleClick={() => handleLike(post.id)} />
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-600 italic leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${likedPosts.has(post.id) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}
              >
                <Heart size={14} className={likedPosts.has(post.id) ? 'rotate-45 transition-transform' : ''} />
                <span className="text-[10px] font-black uppercase">{post.likes_count || 0} Likes</span>
              </button>
            </div>
          </div>
        </div>
      ))}
      {(!data.posts || data.posts.length === 0) && (
         <div className="py-32 flex flex-col items-center opacity-20">
            <ImageIcon size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Próximamente</p>
         </div>
      )}
    </div>
  );
};