import { useState, useEffect } from 'react';
import api from '../services/api';

const useShopData = (slug) => {
  const [data, setData] = useState({ business: null, items: [], posts: [] });
  const [allItems, setAllItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const savedItems = localStorage.getItem(`items_cache_${slug}`);
    if (savedItems) setAllItems(JSON.parse(savedItems));
  }, [slug]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [businessRes, itemsRes, postsRes] = await Promise.all([
          api.get(`/business/public/${slug}`),
          api.get(`/business/public/${slug}/items?skip=${currentPage * itemsPerPage}&limit=${itemsPerPage}&q=${searchQuery}`),
          api.get(`/social/public/${slug}`)
        ]);
        setData({
          business: businessRes.data,
          items: itemsRes.data.items || [],
          posts: postsRes.data || []
        });
        setTotalItems(itemsRes.data.total || 0);
        setAllItems(prev => ({ ...prev, ...itemsRes.data.items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}) }));
        localStorage.setItem(`items_cache_${slug}`, JSON.stringify(allItems));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(fetchData, 400);
    return () => clearTimeout(handler);
  }, [slug, currentPage, searchQuery]);

  return {
    data,
    allItems,
    loading,
    currentPage, setCurrentPage,
    totalItems,
    searchQuery, setSearchQuery,
    inputValue, setInputValue
  };
};

export default useShopData;