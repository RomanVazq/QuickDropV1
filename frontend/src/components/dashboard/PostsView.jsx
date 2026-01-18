import React from 'react';
import { Trash2 } from 'lucide-react';

const PostsView = ({ posts, onDelete }) => {
  if (posts.length === 0) return <div className="py-20 text-center font-black opacity-20 uppercase italic tracking-widest">No hay publicaciones aún</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 group">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {post.image_url && <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            <button onClick={() => onDelete(post.id)} className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-red-500 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4 line-clamp-3">{post.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostsView;