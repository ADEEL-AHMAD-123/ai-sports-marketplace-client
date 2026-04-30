// components/admin/DistBar.jsx
import React from 'react';
import styles from '../../pages/admin/AdminDashboard.module.scss';

export default function DistBar({ label, tooltip, values, total, colorMap }) {
  if (!total || !values) return (
    <div className={styles.distBar}>
      <p className={styles.distLabel}>{label}</p>
      <p className={styles.distEmpty}>No data yet</p>
    </div>
  );

  const items = Object.entries(values).map(([k, v]) => ({
    key: k, count: v, pct: Math.round((v / total) * 100),
  }));

  return (
    <div className={styles.distBar} title={tooltip || ''}>
      <div className={styles.distHead}>
        <p className={styles.distLabel}>{label}</p>
        <span className={styles.distTotal}>{total} total</span>
      </div>
      <div className={styles.distTrack}>
        {items.map(({ key, pct }) =>
          pct > 0 && (
            <div
              key={key}
              className={styles.distSeg}
              style={{ width: `${pct}%`, background: colorMap?.[key] || 'var(--color-info)' }}
              title={`${key}: ${pct}%`}
            />
          )
        )}
      </div>
      <div className={styles.distLegend}>
        {items.map(({ key, count, pct }) => (
          <span key={key} className={styles.distItem}>
            <span className={styles.distDot} style={{ background: colorMap?.[key] || 'var(--color-info)' }} />
            <span className={styles.distKey}>{key}</span>
            <span className={styles.distCount}>{count}</span>
            <span className={styles.distPct}>({pct}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}