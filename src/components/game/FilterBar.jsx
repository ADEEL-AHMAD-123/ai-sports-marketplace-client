/**
 * FilterBar.jsx — The global filter bar for props
 * Filters: All | High Confidence | Best Value
 */
import React from 'react';
import styles from './FilterBar.module.css';

const FILTERS = [
  { key: 'all',            label: 'All Bets',        icon: '◈' },
  { key: 'highConfidence', label: 'High Confidence',  icon: '🎯' },
  { key: 'bestValue',      label: 'Best Value',       icon: '⚡' },
];

export default function FilterBar({ activeFilter, onChange }) {
  return (
    <div className={styles.bar}>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          className={`${styles.btn} ${activeFilter === f.key ? styles.active : ''}`}
          onClick={() => onChange(f.key)}
        >
          <span className={styles.icon}>{f.icon}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}