import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { adminAPI, getErrorMsg } from '@/services/api';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { SPORTS } from '@/constants/app';
import styles from './AdminInsightsPage.module.scss';

export default function AdminInsightsPage() {
  const qc = useQueryClient();
  const [page, setPage]   = useState(1);
  const [sport, setSport] = useState('');

  const { data, isLoading } = useQuery(
    ['adminInsights', page, sport],
    () => adminAPI.listInsights({ page, limit: 15, sport: sport || undefined }).then(r => r.data),
    { keepPreviousData: true }
  );

  const deleteInsight = useMutation(adminAPI.deleteInsight, {
    onSuccess: () => { toast.success('Insight deleted — will regenerate on next unlock'); qc.invalidateQueries(['adminInsights']); },
    onError: (e) => toast.error(getErrorMsg(e)),
  });

  const confirmDelete = (id, player) => {
    if (window.confirm(`Delete insight for ${player}? It will regenerate on next user unlock.`)) {
      deleteInsight.mutate(id);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Insights</h1>
        {data && <span className={styles.total}>{data.pagination?.total ?? 0} total</span>}
      </div>

      {/* Sport filter */}
      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${!sport ? styles.active : ''}`} onClick={() => { setSport(''); setPage(1); }}>All Sports</button>
        {SPORTS.filter(s => s.active).map(s => (
          <button key={s.key} className={`${styles.filterBtn} ${sport === s.key ? styles.active : ''}`} onClick={() => { setSport(s.key); setPage(1); }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>{[...Array(8)].map((_, i) => <Skeleton key={i} height={52} />)}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Player</th>
                <th>Stat / Line</th>
                <th>Rec</th>
                <th>Confidence</th>
                <th>Edge</th>
                <th>Tags</th>
                <th>Unlocks</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((ins) => (
                <tr key={ins._id}>
                  <td className={styles.playerCell}>
                    <p className={styles.playerName}>{ins.playerName}</p>
                    <p className={styles.sport}>{ins.sport?.toUpperCase()}</p>
                  </td>
                  <td>
                    <p className={styles.statType}>{ins.statType}</p>
                    <p className={styles.line}>{ins.bettingLine}</p>
                  </td>
                  <td>
                    {ins.recommendation && (
                      <Badge variant={ins.recommendation === 'over' ? 'over' : 'under'}>
                        {ins.recommendation === 'over' ? '▲ OVER' : '▼ UNDER'}
                      </Badge>
                    )}
                  </td>
                  <td>
                    {ins.confidenceScore != null && (
                      <span style={{ fontFamily: 'var(--font-mono)', color: ins.confidenceScore >= 80 ? 'var(--color-accent)' : ins.confidenceScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                        {ins.confidenceScore}%
                      </span>
                    )}
                  </td>
                  <td>
                    {ins.edgePercentage != null && (
                      <span style={{ fontFamily: 'var(--font-mono)', color: ins.edgePercentage > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                        {ins.edgePercentage > 0 ? '+' : ''}{ins.edgePercentage}%
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.tags}>
                      {ins.isHighConfidence && <Badge variant="accent">HC</Badge>}
                      {ins.isBestValue && <Badge variant="warning">BV</Badge>}
                    </div>
                  </td>
                  <td className={styles.mono}>{ins.unlockCount ?? 0}</td>
                  <td className={styles.date}>{new Date(ins.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => confirmDelete(ins._id, ins.playerName)} title="Delete insight">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination?.pages > 1 && (
        <div className={styles.pagination}>
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span>{page} / {data.pagination.pages}</span>
          <Button variant="ghost" size="sm" disabled={page === data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}