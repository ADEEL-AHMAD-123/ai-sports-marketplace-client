import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { selectIsLoggedIn, getLoggedInUser } from '@/store/slices/authSlice';
import { setActiveSport } from '@/store/slices/uiSlice';
import { useTheme } from '@/hooks/useTheme';
import api from '@/services/api';

import Navbar         from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminLayout    from '@/components/layout/AdminLayout';
import ErrorBoundary  from '@/components/ui/ErrorBoundary';

import HomePage             from '@/pages/user/HomePage';
import MatchPage            from '@/pages/user/MatchPage';
import WalletPage           from '@/pages/user/WalletPage';
import TransactionDetailPage from '@/pages/user/TransactionDetailPage';
import HistoryPage          from '@/pages/user/HistoryPage';
import PricingPage        from '@/pages/PricingPage';
import BillingSuccessPage from '@/pages/billing/BillingSuccessPage';
import BillingCancelPage  from '@/pages/billing/BillingCancelPage';
import LoginPage          from '@/pages/auth/LoginPage';
import RegisterPage       from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage';
import EmailVerifyPage    from '@/pages/auth/EmailVerifyPage';
import NotFoundPage       from '@/pages/NotFoundPage';

import AdminDashboard    from '@/pages/admin/AdminDashboard';
import AdminUsersPage    from '@/pages/admin/AdminUsersPage';
import AdminOutcomesPage from '@/pages/admin/AdminOutcomesPage';
import AdminJobsPage     from '@/pages/admin/AdminJobsPage';

export default function App() {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  useTheme();

  useEffect(() => {
    if (isLoggedIn) dispatch(getLoggedInUser());
  }, []); // eslint-disable-line

  // ── Smart default sport ─────────────────────────────────────
  // On every fresh app load, ask the backend which sports actually have
  // games in the display window and auto-select the highest-priority one
  // (NBA > MLB > NHL > NFL > Soccer). This keeps a user opening the app
  // during e.g. NBA off-season from landing on an empty NBA slate.
  //
  // Priority order matches the app's sport lineup — NBA is the "hero"
  // sport and the fallback when nothing else has games.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/odds/counts');
        const counts = res?.data?.counts;
        if (!counts) return;
        const order = ['nba', 'mlb', 'nhl', 'nfl', 'soccer'];
        const pick  = order.find((s) => (counts[s] || 0) > 0) || 'nba';
        dispatch(setActiveSport(pick));
      } catch {
        // Silent fail — the app just stays on the persisted / default sport.
      }
    })();
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
        <Route path="/pricing"               element={<PricingPage />} />
        <Route path="/login"                 element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register"              element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
        <Route path="/reset-password"        element={<ResetPasswordPage />} />
        <Route path="/verify-email"          element={<EmailVerifyPage />} />

        {/* Billing landing pages — public so Stripe can redirect users
            (webhook is the source of truth, so no auth needed to view). */}
        <Route path="/billing/success"       element={<BillingSuccessPage />} />
        <Route path="/billing/cancel"        element={<BillingCancelPage />} />

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/wallet"          element={<WalletPage />} />
          <Route path="/wallet/tx/:txId" element={<TransactionDetailPage />} />
          <Route path="/history"         element={<HistoryPage />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index             element={<AdminDashboard />} />
            <Route path="users"      element={<AdminUsersPage />} />
            <Route path="outcomes"   element={<AdminOutcomesPage />} />
            <Route path="jobs"       element={<AdminJobsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}