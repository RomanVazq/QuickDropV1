import { useState, useEffect } from 'react';

const useCart = (slug) => {
  const [cart, setCart] = useState({});
  const [formData, setFormData] = useState({
    customer_name: '', address: '', appointment_datetime: '', notes: ''
  });

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${slug}`);
    if (savedCart) setCart(JSON.parse(savedCart));
  }, [slug]);

  useEffect(() => {
    localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
  }, [cart, slug]);

  const addToCart = (item, quantity = 1, selectedOptions = {}) => {
    setCart(prev => {
      const key = `${item.id}_${JSON.stringify(selectedOptions)}`;
      const existing = prev[key] || { ...item, quantity: 0, selectedOptions };
      return { ...prev, [key]: { ...existing, quantity: existing.quantity + quantity } };
    });
  };

  const removeFromCart = (key) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[key];
      return newCart;
    });
  };

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setCart(prev => ({
      ...prev,
      [key]: { ...prev[key], quantity }
    }));
  };

  const clearCart = () => {
    setCart({});
  };

  const getTotal = () => {
    return Object.values(cart).reduce((total, item) => {
      let price = item.price;
      if (item.selectedOptions?.variant) price += item.selectedOptions.variant.price;
      if (item.selectedOptions?.extras) {
        price += item.selectedOptions.extras.reduce((sum, extra) => sum + extra.price, 0);
      }
      return total + price * item.quantity;
    }, 0);
  };

  return {
    cart,
    formData, setFormData,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal
  };
};

export default useCart;