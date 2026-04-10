/**
 * ProtectedRoute.jsx
 * Redirects to /login if user is not authenticated.
 * Saves the intended destination so we can redirect after login.
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '@/store/slices/authSlice';

export default function ProtectedRoute() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    // Pass the current path so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}