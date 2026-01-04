import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PublicShop from './pages/PublicShop';
import SuperAdmin from './pages/SuperAdmin';
import './index.css'
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/shop/:slug" element={
          <ProtectedRoute><PublicShop /></ProtectedRoute>
          } />
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;