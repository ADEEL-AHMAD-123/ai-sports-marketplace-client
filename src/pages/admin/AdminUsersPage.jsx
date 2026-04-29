// src/pages/admin/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectToken } from '@/store/slices/authSlice';
import styles from './AdminUsersPage.module.scss';

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

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminUsersPage() {
  const token = useSelector(selectToken);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [pagination,    setPagination]    = useState({});
  const [creditModal,   setCreditModal]   = useState(null); // { userId, name, credits }
  const [creditDelta,   setCreditDelta]   = useState('');
  const [creditReason,  setCreditReason]  = useState('');
  const [submitting,    setSubmitting]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search.trim()) params.set('search', search.trim());
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
  }, [token, page, search]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdjustCredits = async () => {
    const delta = parseInt(creditDelta, 10);
    if (!delta || isNaN(delta))         { toast.error('Enter a valid delta (e.g. 10 or -5)'); return; }
    if (!creditReason.trim())           { toast.error('Reason is required'); return; }
    setSubmitting(true);
    try {
      const res  = await apiFetch(`/admin/users/${creditModal.userId}/credits`, token, {
        method: 'PATCH',
        body:   JSON.stringify({ delta, reason: creditReason.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Credits adjusted for ${creditModal.name} → ${data.newBalance}`);
      setCreditModal(null);
      setCreditDelta('');
      setCreditReason('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId, name, currentlyActive) => {
    const next = !currentlyActive;
    try {
      const res  = await apiFetch(`/admin/users/${userId}/status`, token, {
        method: 'PATCH',
        body:   JSON.stringify({ isActive: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`${name} ${next ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          {pagination.total != null && (
            <p className={styles.pageSub}>{pagination.total} total accounts</p>
          )}
        </div>
        <div className={styles.controls}>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.refreshBtn} onClick={load} title="Refresh">↻</button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Credits</span>
          <span>Insights</span>
          <span>Joined</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className={styles.tableMsg}>Loading users…</div>
        ) : users.length === 0 ? (
          <div className={styles.tableMsg}>{search ? `No results for "${search}"` : 'No users yet.'}</div>
        ) : (
          users.map(u => (
            <div key={u._id} className={styles.tableRow}>
              <span className={styles.cellName}>{u.name}</span>
              <span className={styles.cellEmail}>{u.email}</span>
              <span>
                <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>
                  {u.role}
                </span>
              </span>
              <span className={styles.cellMono}>{u.credits ?? 0}</span>
              <span className={styles.cellMono}>{u.unlockedInsights?.length ?? 0}</span>
              <span className={styles.cellMuted} title={new Date(u.createdAt).toLocaleString()}>
                {timeAgo(u.createdAt)}
              </span>
              <span>
                <span className={u.isActive !== false ? styles.statusActive : styles.statusInactive}>
                  {u.isActive !== false ? 'active' : 'inactive'}
                </span>
              </span>
              <span className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => {
                    setCreditModal({ userId: u._id, name: u.name, credits: u.credits ?? 0 });
                    setCreditDelta('');
                    setCreditReason('');
                  }}
                >
                  Credits
                </button>
                <button
                  className={`${styles.actionBtn} ${u.isActive !== false ? styles.actionBtnDanger : styles.actionBtnAccent}`}
                  onClick={() => handleToggleStatus(u._id, u.name, u.isActive !== false)}
                >
                  {u.isActive !== false ? 'Deactivate' : 'Activate'}
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={styles.pageInfo}>{page} / {pagination.pages}</span>
          <button className={styles.pageBtn} disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Credit modal */}
      {creditModal && (
        <div className={styles.modalOverlay} onClick={() => setCreditModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Adjust Credits</h3>
            <p className={styles.modalSub}>{creditModal.name} · current balance: {creditModal.credits}</p>
            <input
              className={styles.modalInput}
              type="number"
              placeholder="Delta (e.g. 10 or -5)"
              value={creditDelta}
              onChange={e => setCreditDelta(e.target.value)}
              autoFocus
            />
            <input
              className={styles.modalInput}
              placeholder="Reason (required)"
              value={creditReason}
              onChange={e => setCreditReason(e.target.value)}
            />
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setCreditModal(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAdjustCredits} disabled={submitting}>
                {submitting ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}