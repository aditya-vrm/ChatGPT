import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#07090e', color: '#94a3b8' }}>
        <div>Loading session...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/Login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#07090e', color: '#94a3b8' }}>
        <div>Loading session...</div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path='/Register' element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        } />
        <Route path='/Login' element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } />
        <Route path='*' element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
