// components/admin/PredictionRow.jsx
import React from 'react';
import styles from '../../pages/admin/AdminDashboard.module.scss';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PredictionRow({ insight }) {
  const edge    = parseFloat(insight.edgePercentage || 0);
  const isOver  = insight.recommendation === 'over';
  const absEdge = Math.abs(edge);

  return (
    <div className={styles.predRow}>
      <div className={styles.predPlayer}>
        <span className={styles.predName}>{insight.playerName}</span>
        <span className={styles.predStat}>{insight.statType} · Line {insight.bettingLine}</span>
      </div>
      <span className={`${styles.predRec} ${isOver ? styles.recOver : styles.recUnder}`}>
        {isOver ? '▲' : '▼'} {insight.recommendation?.toUpperCase()} {insight.bettingLine}
      </span>
      <span className={`${styles.predEdge} ${absEdge >= 15 ? styles.edgeStrong : absEdge >= 8 ? styles.edgeMed : ''}`}>
        {edge >= 0 ? '+' : ''}{edge.toFixed(1)}%
      </span>
      <span className={`${styles.predConf} ${styles[`conf_${insight.aiConfidenceLabel}`]}`}>
        {insight.aiConfidenceLabel || '—'}
      </span>
      <div className={styles.predTags}>
        {insight.isHighConfidence && <span className={styles.tagHC} title="High Confidence">HC</span>}
        {insight.isBestValue      && <span className={styles.tagBV} title="Best Value: edge ≥ 15%">BV</span>}
      </div>
      <span className={styles.predTime}>{timeAgo(insight.createdAt)}</span>
    </div>
  );
}