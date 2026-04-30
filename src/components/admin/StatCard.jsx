// components/admin/StatCard.jsx
import React from 'react';
import styles from '../../pages/admin/AdminDashboard.module.scss';

export default function StatCard({ label, value, sub, tooltip, accentColor }) {
  return (
    <div className={styles.statCard} title={tooltip || ''}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue} style={accentColor ? { color: accentColor } : {}}>
        {value ?? '—'}
      </p>
      {sub     && <p className={styles.statSub}>{sub}</p>}
      {tooltip && <span className={styles.statTooltip}>?</span>}
    </div>
  );
}