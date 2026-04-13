// src/pages/admin/AdminDashboard.jsx
import React from 'react';
import { useAdminStats } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AdminDashboard.module.scss';

const CRON_JOBS = [
  { key: 'morning-scraper', label: 'Morning Scraper',  desc: "Fetch today's schedule"     },
  { key: 'prop-watcher',    label: 'Prop Watcher',     desc: 'Fetch & score all props'    },
  { key: 'post-game-sync',  label: 'Post-Game Sync',   desc: 'Sync finished games'        },
  { key: 'ai-log-cleanup',  label: 'AI Log Cleanup',   desc: 'Delete old AI logs'         },
];

function StatCard({ label, value, sub, color = 'accent' }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue} style={{ color: `var(--color-${color})` }}>{value ?? '—'}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { stats, isLoading, triggerCron } = useAdminStats();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.sub}>Platform overview — auto-refreshes every 60s</p>
      </div>

      {isLoading && !stats ? (
        <div className={styles.statsGrid}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
      ) : (
        <div className={styles.statsGrid}>
          <StatCard label="Total Users"     value={stats?.users?.total}              sub={`+${stats?.users?.newToday ?? 0} today`} />
          <StatCard label="Total Insights"  value={stats?.insights?.total}           sub={`${stats?.insights?.generatedToday ?? 0} today`} color="info" />
          <StatCard label="Credits Spent"   value={stats?.economy?.totalCreditsSpent} sub="all time" color="warning" />
          <StatCard label="Total Revenue"   value={`$${stats?.economy?.totalRevenueUSD ?? '0.00'}`} sub="from Stripe" />
          <StatCard label="Props Available" value={stats?.live?.availableProps}      sub="live markets" color="purple" />
          <StatCard label="Games Today"     value={stats?.live?.scheduledGames}      sub="upcoming" />
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manual Cron Triggers</h2>
        <p className={styles.sectionSub}>Run jobs immediately without waiting for the schedule</p>
        <div className={styles.cronGrid}>
          {CRON_JOBS.map(({ key, label, desc }) => (
            <div key={key} className={styles.cronCard}>
              <div>
                <p className={styles.cronLabel}>{label}</p>
                <p className={styles.cronDesc}>{desc}</p>
              </div>
              <button className={styles.cronBtn} onClick={() => triggerCron(key)}>▶ Run</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}