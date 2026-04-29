// src/components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn, selectIsAdmin } from '@/store/slices/authSlice';

export default function ProtectedRoute({ requireAdmin = false }) {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin    = useSelector(selectIsAdmin);
  const location   = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}