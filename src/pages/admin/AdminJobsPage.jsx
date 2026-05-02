// pages/admin/AdminJobsPage.jsx — Background jobs with grouped layout
import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdmin';
import { CRON_JOBS, CRON_GROUPS } from '@/constants/app';
import styles from './AdminJobsPage.module.scss';

export default function AdminJobsPage() {
  const { triggerCron } = useAdminStats();
  const [jobStatus, setJobStatus] = useState({});

  const trigger = async (key) => {
    setJobStatus(s => ({ ...s, [key]: 'running' }));
    const ok = await triggerCron(key);
    setJobStatus(s => ({ ...s, [key]: ok ? 'done' : 'error' }));
    setTimeout(() => setJobStatus(s => ({ ...s, [key]: null })), 5000);
  };

  const groups = Object.entries(CRON_GROUPS);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Background Jobs</h1>
        <p className={styles.pageHint}>
          Scheduled jobs run automatically. Per-sport jobs let you test one sport in isolation.
          All jobs are idempotent — safe to run multiple times.
        </p>
      </div>

      {groups.map(([groupKey, groupMeta]) => {
        const jobs = CRON_JOBS.filter(j => j.group === groupKey);
        return (
          <div key={groupKey} className={styles.group}>
            <div className={styles.groupLabel} style={{ color: groupMeta.color }}>
              {groupMeta.label}
            </div>
            <div className={styles.jobGrid}>
              {jobs.map(({ key, label, icon, desc, when }) => {
                const status = jobStatus[key];
                const isRunning = status === 'running';
                const isDone    = status === 'done';
                const isError   = status === 'error';
                return (
                  <div key={key} className={`${styles.jobCard} ${isRunning ? styles.jobRunning : ''}`}>
                    <div className={styles.jobTop}>
                      <span className={styles.jobIcon}>{icon}</span>
                      <div className={styles.jobMeta}>
                        <p className={styles.jobName}>{label}</p>
                        <p className={styles.jobWhen}>{when}</p>
                      </div>
                      <button
                        className={`${styles.runBtn} ${isDone ? styles.runDone : isError ? styles.runError : isRunning ? styles.runActive : ''}`}
                        onClick={() => trigger(key)}
                        disabled={isRunning}
                      >
                        {isRunning ? '⟳ Running…'
                          : isDone  ? '✓ Done'
                          : isError ? '✗ Failed'
                          : '▶ Run Now'}
                      </button>
                    </div>
                    <p className={styles.jobDesc}>{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}