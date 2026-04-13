// src/pages/admin/AdminUsersPage.jsx
import React, { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AdminUsersPage.module.scss';

export default function AdminUsersPage() {
  const {
    users, total, pages, page, setPage,
    search, setSearch,
    isLoading, adjustCredits, toggleStatus,
  } = useAdminUsers();

  const [selected,    setSelected]    = useState(null);
  const [creditDelta, setCreditDelta] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [saving,      setSaving]      = useState(false);

  const handleAdjust = async () => {
    setSaving(true);
    const ok = await adjustCredits(selected._id, parseInt(creditDelta), creditReason);
    if (ok) { setSelected(null); setCreditDelta(''); setCreditReason(''); }
    setSaving(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        {total > 0 && <span className={styles.total}>{total} total</span>}
      </div>

      <div className={styles.toolbar}>
        <Input placeholder="Search by name or email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          leftIcon="🔍" className={styles.searchInput} />
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} height={52} />)}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th>
              <th>Credits</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td className={styles.nameCell}>{user.name}</td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td><Badge variant={user.role === 'admin' ? 'warning' : 'neutral'}>{user.role}</Badge></td>
                  <td><span className={styles.creditsVal}>◈ {user.credits}</span></td>
                  <td><Badge variant={user.isActive ? 'accent' : 'danger'} dot>{user.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className={styles.dateCell}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => setSelected(user)} title="Adjust credits">◈</button>
                      <button
                        className={`${styles.actionBtn} ${user.isActive ? styles.deactivate : styles.activate}`}
                        onClick={() => toggleStatus(user._id, !user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? '⊘' : '✓'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>{page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Adjust Credits" size="sm">
        {selected && (
          <div className={styles.creditModal}>
            <p className={styles.creditUser}>
              {selected.name} — current balance: <strong>◈ {selected.credits}</strong>
            </p>
            <Input label="Delta (+ to add, - to deduct)" type="number"
              placeholder="e.g. 5 or -2" value={creditDelta} onChange={e => setCreditDelta(e.target.value)} />
            <Input label="Reason (required)" type="text"
              placeholder="e.g. Compensation for failed insight"
              value={creditReason} onChange={e => setCreditReason(e.target.value)} />
            <button className={styles.applyBtn} disabled={!creditDelta || !creditReason || saving} onClick={handleAdjust}>
              {saving ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}