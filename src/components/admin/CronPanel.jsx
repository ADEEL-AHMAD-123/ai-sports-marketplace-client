// components/admin/CronPanel.jsx
import React, { useState } from 'react';
import { CRON_JOBS, CRON_GROUPS } from '../../constants/app';
import styles from '../../pages/admin/AdminDashboard.module.scss';

export default function CronPanel({ onTrigger }) {
  const [cronStatus, setCronStatus] = useState({});

  const trigger = async (key) => {
    setCronStatus(s => ({ ...s, [key]: 'running' }));
    try {
      const success = await onTrigger(key);
      setCronStatus(s => ({ ...s, [key]: success ? 'done' : 'error' }));
    } catch {
      setCronStatus(s => ({ ...s, [key]: 'error' }));
    } finally {
      setTimeout(() => setCronStatus(s => ({ ...s, [key]: null })), 4000);
    }
  };

  const groups = Object.entries(CRON_GROUPS);

  return (
    <div className={styles.tabContent}>
      <div className={styles.panelTitleGroup} style={{ marginBottom: '20px' }}>
        <h2 className={styles.panelTitle}>Background Jobs</h2>
        <p className={styles.panelDesc}>
          Scheduled jobs run automatically. Per-sport jobs let you test one sport in isolation without waiting for others.
          All jobs are idempotent — safe to run multiple times.
        </p>
      </div>

      {groups.map(([groupKey, groupMeta]) => {
        const groupJobs = CRON_JOBS.filter(j => j.group === groupKey);
        return (
          <div key={groupKey} style={{ marginBottom: '28px' }}>
            <div className={styles.sectionLabel} style={{ color: groupMeta.color }}>
              {groupMeta.label}
            </div>
            <div className={styles.cronGrid}>
              {groupJobs.map(({ key, label, icon, desc, when }) => {
                const status = cronStatus[key];
                return (
                  <div key={key} className={styles.cronCard}>
                    <div className={styles.cronTop}>
                      <span className={styles.cronIcon}>{icon}</span>
                      <div className={styles.cronMeta}>
                        <p className={styles.cronName}>{label}</p>
                        <p className={styles.cronWhen}>{when}</p>
                      </div>
                      <button
                        className={`${styles.cronBtn} ${styles[`cron_${status}`] || ''}`}
                        onClick={() => trigger(key)}
                        disabled={status === 'running'}
                      >
                        {status === 'running' ? '⟳ Running…'
                          : status === 'done'  ? '✓ Done'
                          : status === 'error' ? '✗ Failed'
                          : '▶ Run Now'}
                      </button>
                    </div>
                    <p className={styles.cronDesc}>{desc}</p>
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