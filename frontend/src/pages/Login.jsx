import React from 'react';
import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      if (res.data.is_superuser) {
        navigate('/admin');
      } else {
        
        toast.success("Bienvenido!");
        navigate('/dashboard');
      }

    } catch (err) {
      toast.error("Credenciales inválidas");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl mb-4 font-bold">Iniciar Sesión</h2>
        <input className="block border p-2 mb-4 w-64" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input className="block border p-2 mb-4 w-64" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">Entrar</button>
      </form>
    </div>
  );
};

export default Login;