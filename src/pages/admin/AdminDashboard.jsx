import React from 'react';
import { useQuery } from 'react-query';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { adminAPI, getErrorMsg } from '@/services/api';
import { Skeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import styles from './AdminDashboard.module.scss';

const StatCard = ({ label, value, sub, color = 'accent' }) => (
  <div className={styles.statCard}>
    <p className={styles.statLabel}>{label}</p>
    <p className={styles.statValue} style={{ color: `var(--color-${color})` }}>{value}</p>
    {sub && <p className={styles.statSub}>{sub}</p>}
  </div>
);

const CRON_JOBS = [
  { key: 'morning-scraper', label: 'Morning Scraper', desc: 'Fetch today\'s schedule' },
  { key: 'prop-watcher',    label: 'Prop Watcher',    desc: 'Fetch & score all props' },
  { key: 'post-game-sync',  label: 'Post-Game Sync',  desc: 'Sync finished games' },
  { key: 'ai-log-cleanup',  label: 'AI Log Cleanup',  desc: 'Delete old AI logs' },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery('adminStats', () => adminAPI.getStats().then(r => r.data.stats), { refetchInterval: 60_000 });

  const triggerCron = useMutation(adminAPI.triggerCron, {
    onSuccess: (_, job) => toast.success(`✅ ${job} triggered successfully`),
    onError: (e) => toast.error(getErrorMsg(e)),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.sub}>Platform overview — auto-refreshes every 60s</p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className={styles.statsGrid}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
      ) : (
        <div className={styles.statsGrid}>
          <StatCard label="Total Users"       value={data?.users?.total ?? '—'}          sub={`+${data?.users?.newToday ?? 0} today`} />
          <StatCard label="Total Insights"    value={data?.insights?.total ?? '—'}        sub={`${data?.insights?.generatedToday ?? 0} today`} color="info" />
          <StatCard label="Credits Spent"     value={data?.economy?.totalCreditsSpent ?? '—'} sub="all time" color="warning" />
          <StatCard label="Total Revenue"     value={`$${data?.economy?.totalRevenueUSD ?? '0.00'}`} sub="from Stripe" color="accent" />
          <StatCard label="Available Props"   value={data?.live?.availableProps ?? '—'}   sub="live markets" color="purple" />
          <StatCard label="Scheduled Games"   value={data?.live?.scheduledGames ?? '—'}   sub="upcoming today" />
        </div>
      )}

      {/* Cron job manual triggers */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manual Cron Triggers</h2>
        <p className={styles.sectionSub}>Use these for testing without waiting for the schedule</p>
        <div className={styles.cronGrid}>
          {CRON_JOBS.map(({ key, label, desc }) => (
            <div key={key} className={styles.cronCard}>
              <div>
                <p className={styles.cronLabel}>{label}</p>
                <p className={styles.cronDesc}>{desc}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={triggerCron.isLoading && triggerCron.variables === key}
                onClick={() => triggerCron.mutate(key)}
              >
                ▶ Run
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}