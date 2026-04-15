// src/components/ui/Skeleton.jsx
// Reusable skeleton loader components for every page
import React from 'react';
import styles from './Skeleton.module.scss';

// Single animated block
export function SkeletonBlock({ width = '100%', height = 16, radius = 8, className = '' }) {
  return (
    <div
      className={`${styles.block} ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

// Prop card skeleton
export function PropCardSkeleton() {
  return (
    <div className={styles.propCard}>
      <div className={styles.row}>
        <SkeletonBlock width="60%" height={18} />
        <SkeletonBlock width={40} height={22} radius={99} />
      </div>
      <SkeletonBlock width="35%" height={12} />
      <SkeletonBlock width="100%" height={52} radius={10} />
      <SkeletonBlock width="100%" height={8} radius={4} />
      <SkeletonBlock width="100%" height={44} radius={99} />
    </div>
  );
}

// Game row skeleton
export function GameRowSkeleton() {
  return (
    <div className={styles.gameRow}>
      <div className={styles.teamSk}>
        <SkeletonBlock width={48} height={48} radius={12} />
        <div className={styles.teamInfoSk}>
          <SkeletonBlock width={48} height={20} />
          <SkeletonBlock width={90} height={12} />
        </div>
      </div>
      <div className={styles.centerSk}>
        <SkeletonBlock width={80} height={14} radius={4} />
        <SkeletonBlock width={24} height={10} radius={4} />
      </div>
      <div className={`${styles.teamSk} ${styles.teamSkRight}`}>
        <div className={styles.teamInfoSk}>
          <SkeletonBlock width={48} height={20} />
          <SkeletonBlock width={90} height={12} />
        </div>
        <SkeletonBlock width={48} height={48} radius={12} />
      </div>
      <SkeletonBlock width={110} height={14} radius={4} />
      <SkeletonBlock width={90} height={28} radius={99} />
    </div>
  );
}

// Admin stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className={styles.statCard}>
      <SkeletonBlock width="50%" height={13} />
      <SkeletonBlock width="60%" height={36} />
      <SkeletonBlock width="40%" height={11} />
    </div>
  );
}

// Generic page section skeleton (title + n rows)
export function SectionSkeleton({ rows = 3 }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <SkeletonBlock width={160} height={22} />
        <SkeletonBlock width={60} height={14} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <GameRowSkeleton key={i} />
      ))}
    </div>
  );
}

// Inline loading spinner (small, used inside buttons and headers)
export function Spinner({ size = 18, color = 'currentColor' }) {
  return (
    <svg
      className={styles.spinner}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Full-page centered loader
export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className={styles.pageLoader}>
      <div className={styles.pageLoaderInner}>
        <Spinner size={32} color="var(--color-accent)" />
        <p className={styles.pageLoaderLabel}>{label}</p>
      </div>
    </div>
  );
}

// Alias — Skeleton = SkeletonBlock (for simpler import: import { Skeleton } from '@/components/ui/Skeleton')
export const Skeleton = SkeletonBlock;