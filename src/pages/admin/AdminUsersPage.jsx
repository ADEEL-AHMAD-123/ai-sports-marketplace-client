// pages/admin/AdminUsersPage.jsx — premium user management
//
// Information hierarchy:
//   1. Header — title + search + refresh
//   2. Quick KPIs — total / active / with credits / with insights
//   3. User list — clean rows, no inline styles, role + status pills
//   4. Drill-in: credit-adjust modal with proper validation
//
// Mobile: rows collapse to stacked cards below 720px.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectToken } from '@/store/slices/authSlice';
import s from './AdminUsersPage.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function apiFetch(path, token, opts = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
}

const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');

function timeAgo(date) {
  if (!date) return '—';
  const sec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (sec < 60)    return `${sec}s ago`;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

const initials = (name) => (name || '?')
  .split(' ')
  .filter(Boolean)
  .map(w => w[0])
  .slice(0, 2)
  .join('')
  .toUpperCase();

// ── KPI tile ──────────────────────────────────────────────────────────────────
function Kpi({ label, value, sub }) {
  return (
    <div className={s.kpi}>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
      {sub && <span className={s.kpiSub}>{sub}</span>}
    </div>
  );
}

// ── Status / role pills ───────────────────────────────────────────────────────
function StatusPill({ active }) {
  return (
    <span className={`${s.pill} ${active ? s.pillActive : s.pillInactive}`}>
      <span className={s.pillDot} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
function RolePill({ role }) {
  return (
    <span className={`${s.rolePill} ${role === 'admin' ? s.roleAdmin : s.roleUser}`}>
      {role}
    </span>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onAdjustCredits, onToggleStatus }) {
  const isActive  = user.isActive !== false;
  const credits   = user.credits ?? 0;
  const insights  = user.unlockedInsights?.length ?? 0;
  return (
    <div className={s.row}>
      <div className={s.cellUser}>
        <span className={s.avatar} aria-hidden="true">{initials(user.name)}</span>
        <div className={s.userText}>
          <span className={s.userName}>{user.name || '—'}</span>
          <span className={s.userEmail}>{user.email}</span>
        </div>
      </div>
      <div className={s.cellRole}><RolePill role={user.role || 'user'} /></div>
      <div className={s.cellNum}>
        <span className={s.cellNumPrimary}>{fmt(credits)}</span>
        <span className={s.cellNumLabel}>credits</span>
      </div>
      <div className={s.cellNum}>
        <span className={s.cellNumPrimary}>{fmt(insights)}</span>
        <span className={s.cellNumLabel}>insights</span>
      </div>
      <div className={s.cellMeta}>
        <span className={s.cellTime}>{timeAgo(user.createdAt)}</span>
        <span className={s.cellLabel}>joined</span>
      </div>
      <div className={s.cellStatus}><StatusPill active={isActive} /></div>
      <div className={s.cellActions}>
        <button className={s.btnGhost} onClick={() => onAdjustCredits(user)}>
          Credits
        </button>
        <button
          className={`${s.btnGhost} ${isActive ? s.btnGhostDanger : s.btnGhostAccent}`}
          onClick={() => onToggleStatus(user)}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

// ── Credit modal ──────────────────────────────────────────────────────────────
function CreditModal({ user, onClose, onSubmit, submitting }) {
  const [delta, setDelta]   = useState('');
  const [reason, setReason] = useState('');
  const parsed = parseInt(delta, 10);
  const valid  = Number.isFinite(parsed) && parsed !== 0 && reason.trim().length > 0;
  const newBal = Number.isFinite(parsed) ? user.credits + parsed : user.credits;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <span className={s.modalEyebrow}>Adjust Credits</span>
          <h3 className={s.modalTitle}>{user.name}</h3>
          <p className={s.modalSub}>Current balance: <strong>{user.credits} credits</strong></p>
        </div>
        <div className={s.modalBody}>
          <label className={s.modalField}>
            <span className={s.modalLabel}>Delta</span>
            <input
              className={s.modalInput}
              type="number"
              placeholder="e.g. 10 to add, -5 to remove"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              autoFocus
            />
            <span className={s.modalHint}>
              {Number.isFinite(parsed) && parsed !== 0
                ? `New balance will be ${newBal} credits`
                : 'Enter a positive number to add or negative to remove'}
            </span>
          </label>
          <label className={s.modalField}>
            <span className={s.modalLabel}>Reason</span>
            <input
              className={s.modalInput}
              placeholder="Why is this adjustment happening?"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </label>
        </div>
        <div className={s.modalFooter}>
          <button className={s.btnGhost} onClick={onClose}>Cancel</button>
          <button
            className={s.btnPrimary}
            onClick={() => onSubmit({ delta: parsed, reason: reason.trim() })}
            disabled={!valid || submitting}
          >
            {submitting ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const token = useSelector(selectToken);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [creditModal, setCreditModal] = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  // Debounce the search input — only commit to the "actual" search after 400ms
  // of inactivity. This prevents firing the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Whenever the debounced search changes, reset to page 1 so the user always
  // sees the first matches.
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Single load() bound to both pagination and debounced search — every change
  // (page button click or settled search input) maps to exactly one API call.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res  = await apiFetch(`/admin/users?${params}`, token);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load users');
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleAdjustCredits = async ({ delta, reason }) => {
    setSubmitting(true);
    try {
      const res  = await apiFetch(`/admin/users/${creditModal._id}/credits`, token, {
        method: 'PATCH',
        body:   JSON.stringify({ delta, reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Credits updated for ${creditModal.name} → ${data.newBalance}`);
      setCreditModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextActive = !(user.isActive !== false);
    try {
      const res  = await apiFetch(`/admin/users/${user._id}/status`, token, {
        method: 'PATCH',
        body:   JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`${user.name} ${nextActive ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Quick KPIs from the visible page (not authoritative — just at-a-glance signals)
  const kpis = useMemo(() => ({
    total:        pagination.total ?? users.length,
    active:       users.filter(u => u.isActive !== false).length,
    withCredits:  users.filter(u => (u.credits ?? 0) > 0).length,
    withInsights: users.filter(u => (u.unlockedInsights?.length ?? 0) > 0).length,
  }), [users, pagination.total]);

  return (
    <div className={s.page}>

      {/* Header */}
      <header className={s.header}>
        <div className={s.headerMain}>
          <span className={s.eyebrow}>User Management</span>
          <h1 className={s.title}>Users</h1>
          <p className={s.subtitle}>
            {pagination.total != null
              ? `${fmt(pagination.total)} total account${pagination.total === 1 ? '' : 's'} — adjust credits, toggle status, audit activity.`
              : 'Adjust credits, toggle status, audit activity.'}
          </p>
        </div>
        <div className={s.headerControls}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon} aria-hidden="true">⌕</span>
            <input
              className={s.searchInput}
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className={s.refreshBtn} onClick={load} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <section className={s.kpiRow}>
        <Kpi label="Total Users" value={fmt(kpis.total)} />
        <Kpi label="Active" value={fmt(kpis.active)} sub="on this page" />
        <Kpi label="With Credits" value={fmt(kpis.withCredits)} sub="balance > 0" />
        <Kpi label="Have Unlocked" value={fmt(kpis.withInsights)} sub="≥ 1 insight" />
      </section>

      {/* Table */}
      <div className={s.tableWrap}>
        <div className={s.tableHead}>
          <span>User</span>
          <span>Role</span>
          <span>Credits</span>
          <span>Insights</span>
          <span>Joined</span>
          <span>Status</span>
          <span></span>
        </div>

        {loading ? (
          <div className={s.tableEmpty}>Loading users…</div>
        ) : users.length === 0 ? (
          <div className={s.tableEmpty}>
            {search ? `No results for "${search}"` : 'No users yet.'}
          </div>
        ) : (
          users.map(u => (
            <UserRow
              key={u._id}
              user={u}
              onAdjustCredits={(user) => setCreditModal(user)}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={s.pagination}>
          <button className={s.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={s.pageInfo}>Page {page} of {pagination.pages}</span>
          <button className={s.pageBtn} disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Credit modal */}
      {creditModal && (
        <CreditModal
          user={creditModal}
          onClose={() => setCreditModal(null)}
          onSubmit={handleAdjustCredits}
          submitting={submitting}
        />
      )}
    </div>
  );
}
