import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    // Este header debe coincidir EXACTAMENTE con el del Backend
    'X-Internal-Client': import.meta.env.VITE_INTERNAL_CLIENT_KEY
  }
});

// Interceptor para el Token de Usuario (JWT)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;