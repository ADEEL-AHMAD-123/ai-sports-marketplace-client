// components/ui/Skeleton.jsx
import React from 'react';
import styles from './Skeleton.module.scss';

export function Skeleton({ height = 20, width, borderRadius, className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        height,
        width: width || '100%',
        borderRadius: borderRadius || 'var(--radius-md)',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton height={14} width="40%" />
      <div className={styles.row}>
        <Skeleton height={36} width="28%" />
        <Skeleton height={20} width="15%" />
        <Skeleton height={36} width="28%" />
      </div>
      <Skeleton height={1} />
      <div className={styles.row}>
        <Skeleton height={12} width="35%" />
        <Skeleton height={12} width="25%" />
      </div>
    </div>
  );
}