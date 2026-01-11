import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'X-Internal-Client': import.meta.env.VITE_INTERNAL_CLIENT_KEY
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sesión expirada o inválida (401). Limpiando datos...");
      localStorage.removeItem('token');

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;