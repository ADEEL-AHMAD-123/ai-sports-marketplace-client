// src/hooks/useAdmin.js
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { createApiThunk } from '@/utils/apiHelper';
import { getErrorMsg } from '@/services/api';

// ── Admin-specific thunks ─────────────────────────────────────
export const fetchAdminStats = createApiThunk({
  typePrefix: 'admin/fetchStats',
  method: 'GET',
  url: '/admin/stats',
});

export const fetchAdminUsers = createApiThunk({
  typePrefix: 'admin/fetchUsers',
  method: 'GET',
  url: '/admin/users',
});

export const adjustUserCredits = createApiThunk({
  typePrefix: 'admin/adjustCredits',
  method: 'PATCH',
  url: ({ userId }) => `/admin/users/${userId}/credits`,
});

export const setUserStatus = createApiThunk({
  typePrefix: 'admin/setUserStatus',
  method: 'PATCH',
  url: ({ userId }) => `/admin/users/${userId}/status`,
});

export const fetchAdminInsights = createApiThunk({
  typePrefix: 'admin/fetchInsights',
  method: 'GET',
  url: '/admin/insights',
});

export const deleteAdminInsight = createApiThunk({
  typePrefix: 'admin/deleteInsight',
  method: 'DELETE',
  url: ({ insightId }) => `/admin/insights/${insightId}`,
});

export const fetchAILogs = createApiThunk({
  typePrefix: 'admin/fetchAILogs',
  method: 'GET',
  url: '/admin/logs/ai',
});

export const triggerCronJob = createApiThunk({
  typePrefix: 'admin/triggerCron',
  method: 'POST',
  url: ({ job }) => `/admin/cron/${job}`,
});

// ── Hooks ─────────────────────────────────────────────────────

/**
 * useAdminStats()
 * Use on AdminDashboard.
 */
export function useAdminStats() {
  const dispatch = useDispatch();
  const [stats,     setStats]     = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchAdminStats())
      .then(r => { if (r.payload?.stats) setStats(r.payload.stats); })
      .finally(() => setIsLoading(false));

    // Auto-refresh every 60s
    const interval = setInterval(() => {
      dispatch(fetchAdminStats()).then(r => { if (r.payload?.stats) setStats(r.payload.stats); });
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const triggerCron = async (job) => {
    const result = await dispatch(triggerCronJob({ job }));
    if (triggerCronJob.fulfilled.match(result)) {
      toast.success(`✅ ${job} triggered successfully`);
    } else {
      toast.error(result.payload?.message || 'Cron trigger failed');
    }
  };

  return { stats, isLoading, triggerCron };
}

/**
 * useAdminUsers()
 * Use on AdminUsersPage.
 */
export function useAdminUsers() {
  const dispatch = useDispatch();
  const [users,     setUsers]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = () => {
    setIsLoading(true);
    dispatch(fetchAdminUsers({ params: { page, limit: 15, search: search || undefined } }))
      .then(r => {
        if (r.payload?.data)  setUsers(r.payload.data);
        if (r.payload?.total) setTotal(r.payload.total);
        if (r.payload?.pages) setPages(r.payload.pages);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [page, search]);

  const adjustCredits = async (userId, delta, reason) => {
    const result = await dispatch(adjustUserCredits({ userId, data: { delta, reason } }));
    if (adjustUserCredits.fulfilled.match(result)) {
      toast.success('Credits adjusted');
      load();
      return true;
    } else {
      toast.error(result.payload?.message || 'Failed to adjust credits');
      return false;
    }
  };

  const toggleStatus = async (userId, isActive) => {
    const result = await dispatch(setUserStatus({ userId, data: { isActive } }));
    if (setUserStatus.fulfilled.match(result)) {
      toast.success(`User ${isActive ? 'activated' : 'deactivated'}`);
      load();
    } else {
      toast.error(result.payload?.message || 'Failed to update status');
    }
  };

  return {
    users, total, pages, page, setPage,
    search, setSearch,
    isLoading, load,
    adjustCredits, toggleStatus,
  };
}

/**
 * useAdminInsights()
 * Use on AdminInsightsPage.
 */
export function useAdminInsights() {
  const dispatch = useDispatch();
  const [insights,  setInsights]  = useState([]);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [sport,     setSport]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = () => {
    setIsLoading(true);
    dispatch(fetchAdminInsights({ params: { page, limit: 15, sport: sport || undefined } }))
      .then(r => {
        if (r.payload?.data)             setInsights(r.payload.data);
        if (r.payload?.pagination?.pages) setPages(r.payload.pagination.pages);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [page, sport]);

  const deleteInsight = async (insightId, playerName) => {
    if (!window.confirm(`Delete insight for ${playerName}? It regenerates on next unlock.`)) return;
    const result = await dispatch(deleteAdminInsight({ insightId }));
    if (deleteAdminInsight.fulfilled.match(result)) {
      toast.success('Insight deleted');
      load();
    } else {
      toast.error(result.payload?.message || 'Delete failed');
    }
  };

  return {
    insights, pages, page, setPage,
    sport, setSport,
    isLoading, load, deleteInsight,
  };
}

/**
 * useAILogs()
 * Use on AdminAILogsPage.
 */
export function useAILogs() {
  const dispatch = useDispatch();
  const [logs,      setLogs]      = useState([]);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchAILogs({ params: { page, limit: 10 } }))
      .then(r => {
        if (r.payload?.data)             setLogs(r.payload.data);
        if (r.payload?.pagination?.pages) setPages(r.payload.pagination.pages);
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  return { logs, pages, page, setPage, isLoading };
}