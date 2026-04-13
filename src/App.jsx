// client/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { selectIsLoggedIn, selectIsAdmin, getLoggedInUser } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';

import Navbar         from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminLayout    from '@/components/layout/AdminLayout';
import ErrorBoundary  from '@/components/ui/ErrorBoundary';

import HomePage           from '@/pages/user/HomePage';
import MatchPage          from '@/pages/user/MatchPage';
import WalletPage         from '@/pages/user/WalletPage';
import LoginPage          from '@/pages/auth/LoginPage';
import RegisterPage       from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage';
import NotFoundPage       from '@/pages/NotFoundPage';

import AdminDashboard    from '@/pages/admin/AdminDashboard';
import AdminUsersPage    from '@/pages/admin/AdminUsersPage';
import AdminInsightsPage from '@/pages/admin/AdminInsightsPage';
import AdminAILogsPage   from '@/pages/admin/AdminAILogsPage';

export default function App() {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  // Apply persisted theme on mount
  useTheme();

  // Silently refresh user data on app load (keeps credits in sync)
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(getLoggedInUser());
    }
  }, []);

  // Handle Stripe redirect params
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('purchase') === 'success')   toast.success('Payment successful! Credits added.', { icon: '🎉', duration: 5000 });
    if (p.get('purchase') === 'cancelled') toast('Payment cancelled.', { icon: '↩️' });
    if (p.get('session')  === 'expired')   toast.error('Session expired. Please log in again.');
  }, []);

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <ErrorBoundary label="Application failed to load. Please refresh the page.">
      {!isAdminPath && <Navbar />}
      <Routes>
        <Route path="/"                      element={<HomePage />} />
        <Route path="/match/:sport/:eventId" element={<MatchPage />} />
        <Route path="/login"                 element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register"              element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
        <Route path="/reset-password"        element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/wallet" element={<WalletPage />} />
        </Route>

        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index           element={<AdminDashboard />} />
            <Route path="users"    element={<AdminUsersPage />} />
            <Route path="insights" element={<AdminInsightsPage />} />
            <Route path="ai-logs"  element={<AdminAILogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}