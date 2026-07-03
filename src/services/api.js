// src/services/api.js
//
// Configured axios instance + Stripe payment helper functions.
// Most read-only API calls go through Redux thunks (apiHelper.js). The
// helpers here are for redirect-based flows (checkout, portal) where we
// send the browser to Stripe's hosted UI and want to skip Redux entirely.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

export default api;

// ── Auth-header helper ─────────────────────────────────────────
// Every helper below accepts the token from Redux state and injects it
// as an Authorization header — the axios instance itself isn't wired to
// Redux to avoid a circular import.
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

// ── Stripe Checkout — creates session, returns hosted URL ─────
// Called from useWallet. We redirect the browser (not fetch on click),
// so the response is just { url } and the caller sets window.location.
export const createCheckoutSession = async (packId, token) => {
  const res = await api.post(
    '/credits/checkout',
    { packId },
    { headers: authHeaders(token) },
  );
  return res.data;
};

// ── Single transaction detail ─────────────────────────────────
// Fetches one transaction (must belong to the caller) with all Stripe
// metadata for the wallet detail page.
export const fetchTransaction = async (transactionId, token) => {
  const res = await api.get(
    `/credits/transactions/${transactionId}`,
    { headers: authHeaders(token) },
  );
  return res.data;
};

// ── Self-serve refund ──────────────────────────────────────────
// Server enforces the 2-hour window and unlock-lockout rules; the frontend
// just gets a friendly error message back if the request is denied.
export const requestRefund = async (transactionId, token) => {
  const res = await api.post(
    `/credits/refund/${transactionId}`,
    {},
    { headers: authHeaders(token) },
  );
  return res.data;
};

// ── Spend summary (lifetime stats) ─────────────────────────────
export const fetchSpendSummary = async (token) => {
  const res = await api.get(
    '/credits/summary',
    { headers: authHeaders(token) },
  );
  return res.data;
};

// ── Helper to extract a clean error message from any error ────
export const getErrorMsg = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong.';
