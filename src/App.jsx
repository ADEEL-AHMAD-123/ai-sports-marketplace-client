import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { selectIsLoggedIn, selectIsAdmin, updateUser } from '@/store/slices/authSlice';
import { authAPI } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';

import Navbar          from '@/components/layout/Navbar';
import ProtectedRoute  from '@/components/layout/ProtectedRoute';
import AdminLayout     from '@/components/layout/AdminLayout';

import HomePage           from '@/pages/user/HomePage';
import MatchPage          from '@/pages/user/MatchPage';
import WalletPage         from '@/pages/user/WalletPage';
import LoginPage          from '@/pages/auth/LoginPage';
import RegisterPage       from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage';
import AdminDashboard     from '@/pages/admin/AdminDashboard';
import AdminUsersPage     from '@/pages/admin/AdminUsersPage';
import AdminInsightsPage  from '@/pages/admin/AdminInsightsPage';
import AdminAILogsPage    from '@/pages/admin/AdminAILogsPage';
import NotFoundPage       from '@/pages/NotFoundPage';

export default function App() {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  useTheme();

  useQuery(['me'], async () => {
    const res = await authAPI.getMe();
    dispatch(updateUser(res.data.user));
    return res.data.user;
  }, { enabled: isLoggedIn, staleTime: 60_000, retry: false });

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('purchase') === 'success')   toast.success('Payment successful! Credits added.', { duration: 5000, icon: '🎉' });
    if (p.get('purchase') === 'cancelled') toast('Payment cancelled.', { icon: '↩️' });
    if (p.get('session')  === 'expired')   toast.error('Session expired. Please log in again.');
  }, []);

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <>
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
            <Route index             element={<AdminDashboard />} />
            <Route path="users"      element={<AdminUsersPage />} />
            <Route path="insights"   element={<AdminInsightsPage />} />
            <Route path="ai-logs"    element={<AdminAILogsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}