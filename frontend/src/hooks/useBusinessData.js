import { useState, useEffect } from 'react';
import api from '../services/api';

const useBusinessData = () => {
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [business, setBusiness] = useState({ name: '', slug: '', tenant_id: '', wallet: { balance: 0 } });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [orders, setOrders] = useState([]);
  const limit = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const skip = currentPage * limit;
      const [itemsRes, meRes, ordersRes] = await Promise.all([
        api.get(`/business/items?skip=${skip}&limit=${limit}&q=${inputValue}`),
        api.get('/business/me'),
        api.get('/orders/my-orders')
      ]);
      setItems(itemsRes.data.items || []);
      setTotalItems(itemsRes.data.total || 0);
      setBusiness(meRes.data);
      setOrders(ordersRes.data || []);
      const postsRes = await api.get('/social/my-posts');
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data.items || []));
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(handler);
  }, [currentPage, inputValue]);

  return {
    items, setItems,
    posts, setPosts,
    business, setBusiness,
    loading,
    currentPage, setCurrentPage,
    totalItems,
    inputValue, setInputValue,
    orders, setOrders,
    fetchData
  };
};

export default useBusinessData;