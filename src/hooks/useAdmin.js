// src/hooks/useAdmin.js
// Admin-specific data hooks — no Redux slice needed (admin data is ephemeral)
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { createApiThunk } from '@/utils/apiHelper';

// ── Admin thunks (reuse createApiThunk pattern from other slices) ─────────────

export const fetchAdminStats = createApiThunk({
  typePrefix: 'admin/fetchStats',
  method:     'GET',
  url:        '/admin/stats',
});

export const fetchAdminUsers = createApiThunk({
  typePrefix: 'admin/fetchUsers',
  method:     'GET',
  url:        '/admin/users',
});

export const adjustUserCredits = createApiThunk({
  typePrefix: 'admin/adjustCredits',
  method:     'PATCH',
  url:        ({ userId }) => `/admin/users/${userId}/credits`,
});

export const setUserStatus = createApiThunk({
  typePrefix: 'admin/setUserStatus',
  method:     'PATCH',
  url:        ({ userId }) => `/admin/users/${userId}/status`,
});

export const fetchAdminInsights = createApiThunk({
  typePrefix: 'admin/fetchInsights',
  method:     'GET',
  url:        '/admin/insights',
});

export const deleteAdminInsight = createApiThunk({
  typePrefix: 'admin/deleteInsight',
  method:     'DELETE',
  url:        ({ insightId }) => `/admin/insights/${insightId}`,
});

export const fetchAILogs = createApiThunk({
  typePrefix: 'admin/fetchAILogs',
  method:     'GET',
  url:        '/admin/logs/ai',
});

export const triggerCronJob = createApiThunk({
  typePrefix: 'admin/triggerCron',
  method:     'POST',
  url:        ({ job }) => `/admin/cron/${job}`,
});

// ── useAdminStats ─────────────────────────────────────────────────────────────
// Used by AdminDashboard — fetches /admin/stats, auto-refreshes every 60s

export function useAdminStats() {
  const dispatch = useDispatch();
  const [stats,       setStats]       = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await dispatch(fetchAdminStats());
    if (fetchAdminStats.fulfilled.match(result) && result.payload?.stats) {
      setStats(result.payload.stats);
      setLastRefresh(new Date());
    }
    setIsLoading(false);
  }, [dispatch]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Returns true on success, false on failure — used by CronPanel button state
  const triggerCron = useCallback(async (job) => {
    const result = await dispatch(triggerCronJob({ job }));
    if (triggerCronJob.fulfilled.match(result)) {
      toast.success(`${job} triggered`);
      load(); // refresh stats after cron runs
      return true;
    } else {
      toast.error(result.payload?.message || 'Cron trigger failed');
      return false;
    }
  }, [dispatch, load]);

  return { stats, isLoading, lastRefresh, triggerCron, reload: load };
}

// ── useAdminUsers ─────────────────────────────────────────────────────────────
// Used by AdminUsersPage

export function useAdminUsers() {
  const dispatch = useDispatch();
  const [users,     setUsers]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    dispatch(fetchAdminUsers({
      params: {
        page,
        limit: 15,
        search:  search  || undefined,
        role:    roleFilter || undefined,
      },
    })).then(r => {
      if (r.payload?.data)             setUsers(r.payload.data);
      if (r.payload?.pagination?.total) setTotal(r.payload.pagination.total);
      if (r.payload?.pagination?.pages) setPages(r.payload.pagination.pages);
    }).finally(() => setIsLoading(false));
  }, [dispatch, page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const adjustCredits = async (userId, delta, reason) => {
    const result = await dispatch(adjustUserCredits({ userId, data: { delta, reason } }));
    if (adjustUserCredits.fulfilled.match(result)) {
      toast.success('Credits adjusted');
      load();
      return true;
    }
    toast.error(result.payload?.message || 'Failed to adjust credits');
    return false;
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
    roleFilter, setRoleFilter,
    isLoading, load,
    adjustCredits, toggleStatus,
  };
}

// ── useAdminInsights ──────────────────────────────────────────────────────────
// Used by AdminInsightsPage

export function useAdminInsights() {
  const dispatch = useDispatch();
  const [insights,  setInsights]  = useState([]);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [sport,     setSport]     = useState('');
  const [status,    setStatus]    = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    dispatch(fetchAdminInsights({
      params: {
        page,
        limit:  15,
        sport:  sport  || undefined,
        status: status || undefined,
      },
    })).then(r => {
      if (r.payload?.data)             setInsights(r.payload.data);
      if (r.payload?.pagination?.pages) setPages(r.payload.pagination.pages);
    }).finally(() => setIsLoading(false));
  }, [dispatch, page, sport, status]);

  useEffect(() => { load(); }, [load]);

  const deleteInsight = async (insightId, playerName) => {
    if (!window.confirm(`Delete insight for ${playerName}?\nIt will regenerate on next unlock.`)) return;
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
    status, setStatus,
    isLoading, load, deleteInsight,
  };
}

// ── useAILogs ─────────────────────────────────────────────────────────────────
// Used by AdminAILogsPage

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

// ── useAdminPlayers ───────────────────────────────────────────────────────────
// Used by PlayerHealthPanel

export const fetchPlayerHealth = createApiThunk({
  typePrefix: 'admin/fetchPlayerHealth',
  method:     'GET',
  url:        ({ sport = 'nba', limit = 200 } = {}) => `/admin/players/health?sport=${sport}&limit=${limit}`,
});

export const clearPlayerCache = createApiThunk({
  typePrefix: 'admin/clearPlayerCache',
  method:     'DELETE',
  url:        ({ name, sport = 'nba' }) => `/admin/players/${encodeURIComponent(name)}/cache?sport=${sport}`,
});

export function useAdminPlayers(sport = 'nba') {
  const dispatch = useDispatch();
  const [players,  setPlayers]  = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clearing,  setClearing]  = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await dispatch(fetchPlayerHealth({ sport }));
    if (fetchPlayerHealth.fulfilled.match(result)) {
      setPlayers(result.payload.players || []);
    }
    setIsLoading(false);
  }, [dispatch, sport]);

  useEffect(() => { load(); }, [load]);

  const clearCache = async (name) => {
    if (!window.confirm(`Clear ${sport.toUpperCase()} ID cache for "${name}"?\n\nWill be re-resolved on next Prop Watcher run.`)) return;
    setClearing(name);
    const result = await dispatch(clearPlayerCache({ name, sport }));
    if (clearPlayerCache.fulfilled.match(result)) {
      toast.success(`Cache cleared for ${name}`);
      await load();
    } else {
      toast.error(result.payload?.message || 'Failed to clear cache');
    }
    setClearing(null);
  };

  return { players, isLoading, clearing, load, clearCache };
}