// services/api.js
import axios from 'axios';
import { store } from '@/store/index';
import { logout } from '@/store/slices/authSlice';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      store.dispatch(logout());
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(err);
  }
);

export const getErrorMsg = (err) =>
  err.response?.data?.message ||
  err.response?.data?.errors?.[0]?.message ||
  err.message || 'Something went wrong.';

export const authAPI = {
  register:       (d) => api.post('/auth/register', d),
  login:          (d) => api.post('/auth/login', d),
  logout:         ()  => api.post('/auth/logout'),
  getMe:          ()  => api.get('/auth/me'),
  forgotPassword: (e) => api.post('/auth/forgot-password', { email: e }),
  resetPassword:  (d) => api.post('/auth/reset-password', d),
};

export const oddsAPI = {
  getSports: ()                  => api.get('/odds/sports'),
  getGames:  (sport)             => api.get(`/odds/${sport}/games`),
  getProps:  (sport, eid, f)     => api.get(`/odds/${sport}/games/${eid}/props`, {
    params: f && f !== 'all' ? { filter: f } : {},
  }),
};

export const insightAPI = {
  unlock:       (d)  => api.post('/insights/unlock', d),
  getInsight:   (id) => api.get(`/insights/${id}`),
  listInsights: (p)  => api.get('/insights', { params: p }),
};

export const creditsAPI = {
  getBalance:     ()   => api.get('/credits/balance'),
  getCreditPacks: ()   => api.get('/credits/packs'),
  createCheckout: (id) => api.post('/credits/checkout', { packId: id }),
  getTransactions:(p)  => api.get('/credits/transactions', { params: p }),
};

export const adminAPI = {
  getStats:      ()           => api.get('/admin/stats'),
  listUsers:     (p)          => api.get('/admin/users', { params: p }),
  getUser:       (id)         => api.get(`/admin/users/${id}`),
  adjustCredits: (id, d, r)   => api.patch(`/admin/users/${id}/credits`, { delta: d, reason: r }),
  setUserStatus: (id, active) => api.patch(`/admin/users/${id}/status`, { isActive: active }),
  triggerCron:   (job)        => api.post(`/admin/cron/${job}`),
  listInsights:  (p)          => api.get('/admin/insights', { params: p }),
  deleteInsight: (id)         => api.delete(`/admin/insights/${id}`),
  getAILogs:     (p)          => api.get('/admin/logs/ai', { params: p }),
};

export default api;