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

// Run-button label per state.
// "warning" is a distinct state from "done" — job returned success but
// accomplished nothing (e.g. 0 props upserted because quota is exhausted).
const RUN_STATE_LABEL = {
  idle:    '▶ Run now',
  running: '⟳ Running…',
  done:    '✓ Done',
  warning: '⚠ Ran (0 changes)',
  error:   '✗ Failed',
};

// Interpret a job's return payload into a human-readable summary + a
// severity so the UI can style warning vs success. Handles the shapes
// returned by every job registered in the admin JOB_MAP.
function summariseCronResult(result) {
  if (!result || typeof result !== 'object') {
    return { severity: 'done', label: 'Completed', detail: null };
  }

  const parts = [];
  const warnings = [];

  // score-* shape: { scored, failed, noStats, hcTagged, bvTagged,
  //                   hiddenInsufficientGames, hiddenNoStats, totalConsidered }
  if ('scored' in result || 'hcTagged' in result || 'totalConsidered' in result) {
    const total = result.totalConsidered ?? 0;
    parts.push(`${result.scored || 0}/${total} scored`);
    if (result.hcTagged > 0) parts.push(`${result.hcTagged} High Confidence`);
    if (result.bvTagged > 0) parts.push(`${result.bvTagged} Best Value`);
    if (result.hiddenInsufficientGames > 0) parts.push(`${result.hiddenInsufficientGames} hidden (insufficient games)`);
    if (result.hiddenNoStats > 0)           parts.push(`${result.hiddenNoStats} hidden (no stats)`);
    if (result.failed > 0)                  parts.push(`${result.failed} failed`);

    if (total === 0) {
      warnings.push('No stale/unscored props found. Either scoring just ran, or there are no props to score. Trigger prop-watcher first if the slate looks empty.');
    } else if (result.hcTagged === 0 && result.bvTagged === 0) {
      warnings.push('Scoring finished but no prop crossed the HC (≥57 confidence + 5% edge) or BV (per-stat edge threshold) bar. This is normal for pitcher-K-only slates 2+ days out — batter markets bring wider edges when they post 12-24h before kickoff.');
    }
    if (result.hiddenInsufficientGames > 0 || result.hiddenNoStats > 0) {
      const hidden = (result.hiddenInsufficientGames || 0) + (result.hiddenNoStats || 0);
      warnings.push(`${hidden} prop${hidden === 1 ? '' : 's'} were hidden (isAvailable=false) because the player has too few games in the window OR stats couldn't be fetched. That's why some game cards show a low prop count.`);
    }
  }

  // propWatcher shape: { upserted, games, attempted, skippedByPolicy,
  //                      skippedEmpty, engaged, oddsApiQuotaRemaining }
  if ('upserted' in result) {
    parts.push(`${result.upserted} prop${result.upserted === 1 ? '' : 's'} upserted`);
    if (Number.isFinite(result.games)) parts.push(`${result.games} game${result.games === 1 ? '' : 's'} in window`);
    if (Number.isFinite(result.attempted)) parts.push(`${result.attempted} fetched`);
    if (Number.isFinite(result.skippedByPolicy) && result.skippedByPolicy > 0) parts.push(`${result.skippedByPolicy} skipped (interval)`);
    if (Number.isFinite(result.skippedEmpty)   && result.skippedEmpty   > 0) parts.push(`${result.skippedEmpty} returned empty`);

    if (result.oddsApiQuotaRemaining === 0) {
      warnings.push('Odds API key is invalid or monthly quota is 0 — rotate THE_ODDS_API_KEY on Railway and restart.');
    } else if (Number.isFinite(result.oddsApiQuotaRemaining) && result.oddsApiQuotaRemaining < 50) {
      warnings.push(`Odds API quota LOW (${result.oddsApiQuotaRemaining} requests remaining).`);
    }
    if (result.upserted === 0 && result.attempted > 0 && result.skippedEmpty === result.attempted) {
      warnings.push('Every fetch returned empty — sportsbook may have closed markets, or the adapter is quota-safed.');
    }
    if (result.upserted === 0 && result.attempted === 0 && result.games > 0) {
      warnings.push('Every game was inside the polling interval — nothing to fetch this cycle. Try again in a few minutes.');
    }
  }

  // postGameSync shape: { changes, deleted, providerFinalCount, config }
  if ('changes' in result || 'providerFinalCount' in result) {
    if ('providerFinalCount' in result) parts.push(`${result.providerFinalCount || 0} finals from provider`);
    if ('changes' in result)            parts.push(`${result.changes || 0} game${result.changes === 1 ? '' : 's'} updated`);
    if ('deleted' in result && result.deleted > 0) parts.push(`${result.deleted} deleted`);
  }

  // Orchestrator (all-sports) shape: { <sport>: { ... }, ... }
  const sportKeys = ['nba', 'mlb', 'nhl', 'nfl', 'soccer'];
  const perSport = sportKeys.filter(k => result[k] && typeof result[k] === 'object');
  if (perSport.length) {
    for (const sp of perSport) {
      const r = result[sp];
      const n = r?.upserted ?? r?.changes ?? 0;
      parts.push(`${sp.toUpperCase()}: ${n}`);
    }
  }

  const totalActedOn = ('upserted' in result ? (result.upserted || 0) : 0)
    + ('changes'  in result ? (result.changes || 0) : 0)
    + ('deleted'  in result ? (result.deleted || 0) : 0)
    + ('scored'   in result ? (result.scored   || 0) : 0);
  const noopSuccess = parts.length > 0 && totalActedOn === 0 && !perSport.length;

  const severity = warnings.length > 0 || noopSuccess ? 'warning' : 'done';
  const detail = parts.length ? parts.join(' · ') : null;
  const advisory = warnings.length ? warnings.join(' ') : null;
  return { severity, label: severity === 'warning' ? 'Ran with warnings' : 'Completed', detail, advisory };
}

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

function JobCard({ job, status, summary, onRun }) {
  const state = status || 'idle';
  const disabled = state === 'running';
  // Map internal state → SCSS variant. "warning" reuses the existing warning
  // tone from the module; falls back gracefully if that class doesn't exist.
  const variantClass = s[`jobCard_${state}`] || (state === 'warning' ? s.jobCard_done : '');
  const pillClass    = s[`statePill_${state}`] || (state === 'warning' ? s.statePill_done : '');
  const btnClass     = s[`runBtn_${state}`]    || (state === 'warning' ? s.runBtn_done    : '');

  const pillLabel =
    state === 'idle'    ? 'Ready' :
    state === 'running' ? 'In progress' :
    state === 'done'    ? 'Completed' :
    state === 'warning' ? 'Ran with warnings' :
    state === 'error'   ? 'Errored' : 'Ready';

  return (
    <article className={`${s.jobCard} ${variantClass}`}>
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

      {/* Inline outcome — shows what the job actually did on the last run,
          including a warning line when a "success" was actually a no-op.
          Kept below the description so it doesn't push the run button. */}
      {summary && (summary.detail || summary.advisory) && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 8,
            background:
              state === 'warning' ? 'rgba(var(--color-warning-rgb, 234 179 8), 0.08)'
              : 'rgba(var(--color-accent-rgb, 34 197 94), 0.06)',
            border: '1px solid ' + (
              state === 'warning' ? 'rgba(var(--color-warning-rgb, 234 179 8), 0.30)'
              : 'rgba(var(--color-accent-rgb, 34 197 94), 0.20)'
            ),
            fontSize: 12.5,
            lineHeight: 1.45,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-primary)',
          }}
        >
          {summary.detail && (
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>{summary.detail}</div>
          )}
          {summary.advisory && (
            <div style={{
              marginTop: summary.detail ? 6 : 0,
              color: state === 'warning' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              {summary.advisory}
            </div>
          )}
        </div>
      )}

      <div className={s.jobFooter}>
        <span className={`${s.statePill} ${pillClass}`}>{pillLabel}</span>
        <button
          className={`${s.runBtn} ${btnClass}`}
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
  const [jobStatus, setJobStatus]   = useState({});   // key → 'running'|'done'|'warning'|'error'
  const [jobSummary, setJobSummary] = useState({});   // key → { severity, label, detail, advisory }

  const trigger = async (key) => {
    setJobStatus(prev  => ({ ...prev, [key]: 'running' }));
    setJobSummary(prev => ({ ...prev, [key]: null }));

    const outcome = await triggerCron(key);

    if (!outcome.ok) {
      setJobStatus(prev  => ({ ...prev, [key]: 'error' }));
      setJobSummary(prev => ({ ...prev, [key]: { severity: 'error', detail: outcome.error, advisory: null } }));
      // Errors linger longer so admin has time to read the message.
      setTimeout(() => {
        setJobStatus(prev  => ({ ...prev, [key]: null }));
        setJobSummary(prev => ({ ...prev, [key]: null }));
      }, 15000);
      return;
    }

    const summary = summariseCronResult(outcome.result);
    setJobStatus(prev  => ({ ...prev, [key]: summary.severity }));
    setJobSummary(prev => ({ ...prev, [key]: summary }));

    // Warnings stay visible longer so the admin actually reads the reason.
    const clearMs = summary.severity === 'warning' ? 20000 : 8000;
    setTimeout(() => {
      setJobStatus(prev  => ({ ...prev, [key]: null }));
      setJobSummary(prev => ({ ...prev, [key]: null }));
    }, clearMs);
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
                summary={jobSummary[job.key]}
                onRun={trigger}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
