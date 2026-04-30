// components/admin/OutcomeRow.jsx
import React, { useState } from 'react';
import styles from '../../pages/admin/AdminDashboard.module.scss';

const fmt      = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const titleize = (v) => v ? String(v).replace(/_/g, ' ') : '—';
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function OutcomeRow({ row }) {
  const [expanded, setExpanded] = useState(false);
  const isOver  = row.rec === 'over';
  const resultClass = {
    win:  styles.resultWin,
    loss: styles.resultLoss,
    push: styles.resultPush,
  }[row.result] || styles.resultPending;

  return (
    <>
      <div
        className={`${styles.outcomeRow} ${expanded ? styles.outcomeRowExpanded : ''}`}
        onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.outcomePlayer}>
          <span className={styles.outcomeName}>{row.playerName}</span>
          <span className={styles.outcomeMeta}>{(row.sport || '—').toUpperCase()} · {titleize(row.statType)} · Line {row.line}</span>
        </div>
        <span className={`${styles.predRec} ${isOver ? styles.recOver : styles.recUnder}`}>
          {isOver ? '▲' : '▼'} {row.rec?.toUpperCase()} {row.line}
        </span>
        <span className={styles.outcomeActual}>{row.actual != null ? fmt(row.actual, 1) : '—'}</span>
        <span className={`${styles.outcomeResult} ${resultClass}`}>{row.result || 'unresolved'}</span>
        <span className={styles.outcomeMetric}>{row.confidence != null ? `${Math.round(row.confidence)}%` : '—'}</span>
        <span className={styles.outcomeMetric}>{row.edge != null ? `${row.edge >= 0 ? '+' : ''}${Number(row.edge).toFixed(1)}%` : '—'}</span>
        <span className={styles.predTime}>{row.createdAt ? timeAgo(row.createdAt) : '—'}</span>
      </div>

      {expanded && (
        <div className={styles.outcomeDetail}>
          <div className={styles.outcomeDetailGrid}>
            {[
              ['Event ID',        row.eventId],
              ['Game Status',     row.gameStatus],
              ['Stat Type',       titleize(row.statType)],
              ['Betting Line',    row.line],
              ['Actual Stat',     row.actual != null ? fmt(row.actual, 1) : '—'],
              ['Confidence',      row.confidence != null ? `${Number(row.confidence).toFixed(1)}%` : '—'],
              ['Edge %',          row.edge != null ? `${row.edge >= 0 ? '+' : ''}${Number(row.edge).toFixed(2)}%` : '—'],
              ['Recommendation',  row.rec?.toUpperCase()],
              ['Created',         row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'],
            ].map(([label, val]) => (
              <div key={label} className={styles.outcomeDetailItem}>
                <span className={styles.outcomeDetailLabel}>{label}</span>
                <span className={styles.outcomeDetailValue}>{val ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}