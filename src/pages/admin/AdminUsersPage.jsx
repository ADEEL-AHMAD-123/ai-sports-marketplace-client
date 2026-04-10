import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { adminAPI, getErrorMsg } from '@/services/api';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AdminUsersPage.module.scss';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDS] = useState('');
  const [selected, setSelected] = useState(null);  // user for credit modal
  const [creditDelta, setCreditDelta] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // Debounce search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => { setDS(val); setPage(1); }, 400);
  };

  const { data, isLoading } = useQuery(
    ['adminUsers', page, debouncedSearch],
    () => adminAPI.listUsers({ page, limit: 15, search: debouncedSearch || undefined }).then(r => r.data),
    { keepPreviousData: true }
  );

  const adjustCredits = useMutation(
    () => adminAPI.adjustCredits(selected._id, parseInt(creditDelta), creditReason),
    {
      onSuccess: () => {
        toast.success('Credits adjusted');
        qc.invalidateQueries(['adminUsers']);
        setSelected(null); setCreditDelta(''); setCreditReason('');
      },
      onError: (e) => toast.error(getErrorMsg(e)),
    }
  );

  const toggleStatus = useMutation(
    ({ id, isActive }) => adminAPI.setUserStatus(id, isActive),
    {
      onSuccess: (_, { isActive }) => { toast.success(`User ${isActive ? 'activated' : 'deactivated'}`); qc.invalidateQueries(['adminUsers']); },
      onError: (e) => toast.error(getErrorMsg(e)),
    }
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        {data && <span className={styles.total}>{data.total} total</span>}
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          leftIcon="🔍"
          className={styles.searchInput}
        />
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} height={52} />)}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Credits</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((user) => (
                <tr key={user._id}>
                  <td className={styles.nameCell}>{user.name}</td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td>
                    <Badge variant={user.role === 'admin' ? 'warning' : 'neutral'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className={styles.creditsCell}>
                    <span className={styles.creditsVal}>◈ {user.credits}</span>
                  </td>
                  <td>
                    <Badge variant={user.isActive ? 'accent' : 'danger'} dot>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setSelected(user)}
                        title="Adjust credits"
                      >
                        ◈
                      </button>
                      <button
                        className={`${styles.actionBtn} ${user.isActive ? styles.deactivate : styles.activate}`}
                        onClick={() => toggleStatus.mutate({ id: user._id, isActive: !user.isActive })}
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

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className={styles.pagination}>
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className={styles.pageInfo}>{page} / {data.pages}</span>
          <Button variant="ghost" size="sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}

      {/* Credit Adjust Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Adjust Credits" size="sm">
        {selected && (
          <div className={styles.creditModal}>
            <p className={styles.creditUser}>{selected.name} — current balance: <strong>◈ {selected.credits}</strong></p>
            <Input
              label="Credit delta (+ to add, - to deduct)"
              type="number"
              placeholder="e.g. 5 or -2"
              value={creditDelta}
              onChange={(e) => setCreditDelta(e.target.value)}
            />
            <Input
              label="Reason (required)"
              type="text"
              placeholder="e.g. Compensation for failed insight"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
            />
            <Button
              variant="primary"
              fullWidth
              loading={adjustCredits.isLoading}
              disabled={!creditDelta || !creditReason}
              onClick={() => adjustCredits.mutate()}
            >
              Apply Adjustment
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}