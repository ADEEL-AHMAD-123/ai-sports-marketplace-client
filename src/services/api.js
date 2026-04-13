// src/services/api.js
//
// This file is ONLY for the configured axios instance.
// All actual API calls are made via dispatch(someThunk()) in the slices.
// This instance is used internally by apiHelper.js.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

export default api;

// ── Stripe checkout helper (not a thunk — redirects browser) ──
// Called directly from WalletPage, not via Redux
export const createCheckoutSession = async (packId, token) => {
  const res = await api.post(
    '/credits/checkout',
    { packId },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return res.data;
};

// ── Helper to extract a clean error message from any error ────
export const getErrorMsg = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong.';