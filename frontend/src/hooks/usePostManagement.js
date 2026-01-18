import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const usePostManagement = (fetchData, setPosts, posts) => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [file, setFile] = useState(null);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    try {
      await api.delete(`/social/posts/${postId}`);
      toast.success("Publicación eliminada");
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) { toast.error("Error al eliminar"); }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', postContent);
    if (file) formData.append('image', file);
    try {
      await api.post('/social/posts', formData);
      toast.success("¡Publicado!");
      setPostContent(''); setFile(null); setIsPostModalOpen(false);
      fetchData();
    } catch (err) { toast.error("Error"); }
  };

  return {
    isPostModalOpen, setIsPostModalOpen,
    postContent, setPostContent,
    file, setFile,
    handleDeletePost,
    handlePostSubmit
  };
};

export default usePostManagement;