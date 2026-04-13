// src/pages/admin/AdminInsightsPage.jsx
import React from 'react';
import { useAdminInsights } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { SPORTS } from '@/constants/app';
import styles from './AdminInsightsPage.module.scss';

export default function AdminInsightsPage() {
  const {
    insights, pages, page, setPage,
    sport, setSport,
    isLoading, deleteInsight,
  } = useAdminInsights();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Insights</h1>
        {insights.length > 0 && <span className={styles.total}>{insights.length} shown</span>}
      </div>

      {/* Sport filter */}
      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${!sport ? styles.active : ''}`} onClick={() => { setSport(''); setPage(1); }}>All Sports</button>
        {SPORTS.filter(s => s.active).map(s => (
          <button key={s.key} className={`${styles.filterBtn} ${sport === s.key ? styles.active : ''}`} onClick={() => { setSport(s.key); setPage(1); }}>
            {s.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>{[...Array(8)].map((_, i) => <Skeleton key={i} height={52} />)}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Player</th><th>Stat / Line</th><th>Rec</th><th>Confidence</th><th>Edge</th><th>Tags</th><th>Unlocks</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {insights.map(ins => (
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
                      {ins.isBestValue      && <Badge variant="warning">BV</Badge>}
                    </div>
                  </td>
                  <td className={styles.mono}>{ins.unlockCount ?? 0}</td>
                  <td className={styles.date}>{new Date(ins.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => deleteInsight(ins._id, ins.playerName)} title="Delete">🗑</button>
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
    </div>
  );
}