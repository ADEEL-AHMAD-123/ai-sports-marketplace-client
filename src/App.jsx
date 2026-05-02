import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { selectIsLoggedIn, getLoggedInUser } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';

import Navbar         from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminLayout    from '@/components/layout/AdminLayout';
import ErrorBoundary  from '@/components/ui/ErrorBoundary';

import HomePage           from '@/pages/user/HomePage';
import MatchPage          from '@/pages/user/MatchPage';
import WalletPage         from '@/pages/user/WalletPage';
import HistoryPage        from '@/pages/user/HistoryPage';
import LoginPage          from '@/pages/auth/LoginPage';
import RegisterPage       from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage';
import NotFoundPage       from '@/pages/NotFoundPage';

import AdminDashboard    from '@/pages/admin/AdminDashboard';
import AdminUsersPage    from '@/pages/admin/AdminUsersPage';
import AdminOutcomesPage from '@/pages/admin/AdminOutcomesPage';
import AdminPlayersPage  from '@/pages/admin/AdminPlayersPage';
import AdminJobsPage     from '@/pages/admin/AdminJobsPage';
import AdminAILogsPage   from '@/pages/admin/AdminAILogsPage';

export default function App() {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  useTheme();

  useEffect(() => {
    if (isLoggedIn) dispatch(getLoggedInUser());
  }, []); // eslint-disable-line

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('purchase') === 'success')   toast.success('Payment successful! Credits added.', { icon: '🎉', duration: 5000 });
    if (p.get('purchase') === 'cancelled') toast('Payment cancelled.', { icon: '↩️' });
    if (p.get('session')  === 'expired')   toast.error('Session expired. Please log in again.');
  }, []); // eslint-disable-line

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <ErrorBoundary label="Application failed to load. Please refresh the page.">
      {!isAdminPath && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/"                      element={<HomePage />} />
        <Route path="/match/:sport/:eventId" element={<MatchPage />} />
        <Route path="/login"                 element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register"              element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
        <Route path="/reset-password"        element={<ResetPasswordPage />} />

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/wallet"  element={<WalletPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index             element={<AdminDashboard />} />
            <Route path="users"      element={<AdminUsersPage />} />
            <Route path="outcomes"   element={<AdminOutcomesPage />} />
            <Route path="players"    element={<AdminPlayersPage />} />
            <Route path="jobs"       element={<AdminJobsPage />} />
            <Route path="ai-logs"    element={<AdminAILogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}