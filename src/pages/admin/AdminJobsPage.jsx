// pages/admin/AdminJobsPage.jsx — premium cron triggers
//
// Information hierarchy:
//   1. Page header (eyebrow + title + subtitle)
//   2. Schedule overview banner (when does each cron usually fire)
//   3. Job groups (Scheduled / Per-Sport / Cleanup) with their own headers
//   4. Job cards — icon, label, schedule, description, run button with states
//
// Every state (idle / running / done / error) maps to clear visual feedback.

import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdmin';
import { CRON_JOBS, CRON_GROUPS } from '@/constants/app';
import s from './AdminJobsPage.module.scss';

// Run-button label per state
const RUN_STATE_LABEL = {
  idle:    '▶ Run now',
  running: '⟳ Running…',
  done:    '✓ Done',
  error:   '✗ Failed',
};

// Group meta — color tint per group
const GROUP_TONE = {
  scheduled: 'accent',
  sport:     'info',
  cleanup:   'warning',
  default:   'muted',
};

function GroupHeader({ group, count }) {
  return (
    <header className={s.groupHeader}>
      <div className={s.groupTitleWrap}>
        <span className={`${s.groupDot} ${s[`groupDot_${GROUP_TONE[group.key] || 'muted'}`]}`} />
        <h2 className={s.groupTitle}>{group.label}</h2>
        <span className={s.groupCount}>{count} job{count === 1 ? '' : 's'}</span>
      </div>
      {group.description && <p className={s.groupSub}>{group.description}</p>}
    </header>
  );
}

function JobCard({ job, status, onRun }) {
  const state = status || 'idle';
  const disabled = state === 'running';
  return (
    <article className={`${s.jobCard} ${s[`jobCard_${state}`] || ''}`}>
      {/* Soft accent corner glow on hover */}
      <span className={s.jobGlow} aria-hidden="true" />

      <div className={s.jobTop}>
        <span className={s.jobIcon} aria-hidden="true">{job.icon}</span>
        <div className={s.jobMeta}>
          <h3 className={s.jobName}>{job.label}</h3>
          {job.when && (
            <p className={s.jobSchedule}>
              <span className={s.scheduleDot} />
              <span>{job.when}</span>
            </p>
          )}
        </div>
      </div>

      {job.desc && <p className={s.jobDesc}>{job.desc}</p>}

      <div className={s.jobFooter}>
        <span className={`${s.statePill} ${s[`statePill_${state}`] || ''}`}>
          {state === 'idle'    ? 'Ready' :
           state === 'running' ? 'In progress' :
           state === 'done'    ? 'Completed' : 'Errored'}
        </span>
        <button
          className={`${s.runBtn} ${s[`runBtn_${state}`] || ''}`}
          onClick={() => onRun(job.key)}
          disabled={disabled}
        >
          {RUN_STATE_LABEL[state]}
        </button>
      </div>
    </article>
  );
}

export default function AdminJobsPage() {
  const { triggerCron } = useAdminStats();
  const [jobStatus, setJobStatus] = useState({});

  const trigger = async (key) => {
    setJobStatus(s => ({ ...s, [key]: 'running' }));
    const ok = await triggerCron(key);
    setJobStatus(s => ({ ...s, [key]: ok ? 'done' : 'error' }));
    setTimeout(() => setJobStatus(s => ({ ...s, [key]: null })), 5000);
  };

  // Group with extra metadata
  const groups = Object.entries(CRON_GROUPS).map(([key, meta]) => ({
    key,
    label: meta.label || key,
    color: meta.color,
    description: meta.description || null,
    jobs: CRON_JOBS.filter(j => j.group === key),
  })).filter(g => g.jobs.length > 0);

  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerMain}>
          <span className={s.eyebrow}>Operations</span>
          <h1 className={s.title}>Background Jobs</h1>
          <p className={s.subtitle}>
            Cron jobs run automatically. Use these triggers to test a single sport in isolation,
            kick off a fresh data pull, or force a cleanup. Every job is idempotent — safe to run more than once.
          </p>
        </div>
      </header>

      {/* Schedule banner */}
      <section className={s.scheduleBanner}>
        <span className={s.scheduleIcon} aria-hidden="true">⏱</span>
        <div>
          <p className={s.scheduleTitle}>Automatic schedule</p>
          <p className={s.scheduleText}>
            Prop Watcher every 30min · Post-Game Sync every 15min · Morning Scraper 7AM UTC daily · Daily cleanup (AI logs + archive + retry-prune) 3AM UTC
          </p>
        </div>
      </section>

      {/* Job groups */}
      {groups.map(group => (
        <section key={group.key} className={s.group}>
          <GroupHeader group={group} count={group.jobs.length} />
          <div className={s.jobGrid}>
            {group.jobs.map(job => (
              <JobCard
                key={job.key}
                job={job}
                status={jobStatus[job.key]}
                onRun={trigger}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
