// pages/admin/AdminDashboard.jsx — premium overview
//
// Information hierarchy (top → bottom):
//   1. Hero metrics — 3 high-level marquee numbers (Users, Insights, Hit Rate)
//   2. Today snapshot — a compact "what's happening right now" strip
//   3. Per-sport accuracy — 5-up grid of sport tiles with live + lifetime
//   4. Distribution bars — confidence / quality / over-under / outcomes
//   5. Quick actions — 4 navigation cards
//
// Design intent:
//   • Restraint over density. Group related metrics into clusters.
//   • Theme tokens only — no inline colors.
//   • Mono for tabular data, display for marquee numbers.
//   • Responsive: hero metrics wrap to single column on mobile.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStats } from '@/hooks/useAdmin';
import styles from './AdminDashboard.module.scss';

const fmt = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const pct = (n) => n == null ? '—' : `${n}%`;

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const SPORTS = ['nba', 'mlb', 'nhl', 'nfl', 'soccer'];
const SPORT_LABEL = { nba: 'NBA', mlb: 'MLB', nhl: 'NHL', nfl: 'NFL', soccer: 'Soccer' };

// ── Hero metric — large, branded ──────────────────────────────────────────────
function HeroMetric({ label, value, sub, accent }) {
  return (
    <div className={`${styles.heroMetric} ${accent ? styles.heroMetricAccent : ''}`}>
      <span className={styles.heroLabel}>{label}</span>
      <span className={styles.heroValue}>{value}</span>
      {sub && <span className={styles.heroSub}>{sub}</span>}
    </div>
  );
}

// ── Compact stat tile ─────────────────────────────────────────────────────────
function StatTile({ label, value, sub, tone }) {
  return (
    <div className={`${styles.statTile} ${tone ? styles[`statTile_${tone}`] : ''}`}>
      <span className={styles.statTileLabel}>{label}</span>
      <span className={styles.statTileValue}>{value}</span>
      {sub && <span className={styles.statTileSub}>{sub}</span>}
    </div>
  );
}

// ── Sport accuracy tile ───────────────────────────────────────────────────────
function SportTile({ sport, summary }) {
  const wins   = summary?.wins   || 0;
  const losses = summary?.losses || 0;
  const pushes = summary?.pushes || 0;
  const decisive = wins + losses;
  const winRate = decisive ? Math.round((wins * 100) / decisive) : null;
  const tone = winRate == null ? '' : winRate >= 60 ? 'good' : winRate >= 40 ? 'mid' : 'bad';
  return (
    <div className={`${styles.sportTile} ${styles[`sportTile_${sport}`]}`}>
      <span className={styles.sportLabel}>{SPORT_LABEL[sport]}</span>
      <span className={`${styles.sportRate} ${tone ? styles[`sportRate_${tone}`] : ''}`}>
        {winRate != null ? `${winRate}%` : '—'}
      </span>
      <span className={styles.sportRecord}>
        {decisive ? `${wins}W · ${losses}L${pushes ? ` · ${pushes}P` : ''}` : 'no data'}
      </span>
    </div>
  );
}

// ── Distribution bar ──────────────────────────────────────────────────────────
function DistBar({ label, values, total, colorMap }) {
  if (!total || !values) return null;
  const items = Object.entries(values)
    .map(([k, v]) => ({ key: k, count: v, pct: Math.round((v / total) * 100) }))
    .filter(i => i.pct > 0);

  return (
    <div className={styles.distBar}>
      <div className={styles.distHead}>
        <span className={styles.distLabel}>{label}</span>
        <span className={styles.distTotal}>{fmt(total)}</span>
      </div>
      <div className={styles.distTrack}>
        {items.map(({ key, pct }) => (
          <div
            key={key}
            className={styles.distSeg}
            style={{ width: `${pct}%`, background: colorMap?.[key] || 'var(--color-info)' }}
            title={`${key}: ${pct}%`}
          />
        ))}
      </div>
      <div className={styles.distLegend}>
        {items.map(({ key, count, pct }) => (
          <span key={key} className={styles.distLegendItem}>
            <span className={styles.distDot} style={{ background: colorMap?.[key] }} />
            <span className={styles.distLegendKey}>{key}</span>
            <span className={styles.distLegendCount}>{count}</span>
            <span className={styles.distLegendPct}>{pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Quick link card ───────────────────────────────────────────────────────────
function QuickAction({ icon, label, sub, to }) {
  const navigate = useNavigate();
  return (
    <button className={styles.quickAction} onClick={() => navigate(to)}>
      <span className={styles.quickIcon}>{icon}</span>
      <div className={styles.quickText}>
        <span className={styles.quickLabel}>{label}</span>
        <span className={styles.quickSub}>{sub}</span>
      </div>
      <span className={styles.quickArrow}>→</span>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { stats: s, isLoading, lastRefresh } = useAdminStats();

  const insightTotal = s?.insights?.total || 0;
  const outcomeTotal = s?.outcomes?.graded || 0;

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <span className={styles.eyebrow}>Admin Overview</span>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            {isLoading
              ? 'Refreshing…'
              : lastRefresh ? `Updated ${timeAgo(lastRefresh)} · auto-refresh every 60s` : 'Loading platform stats…'}
          </p>
        </div>
      </header>

      {/* Hero metrics */}
      <section className={styles.heroGrid}>
        <HeroMetric
          label="Total Users"
          value={fmt(s?.users?.total)}
          sub={s ? `+${s.users.newToday || 0} today · +${s.users.newThisWeek || 0} this week` : '—'}
        />
        <HeroMetric
          label="Insights Generated"
          value={fmt(insightTotal)}
          sub={s ? `${s.insights.generatedToday || 0} today · ${s.insights.generatedThisWeek || 0} this week` : '—'}
        />
        <HeroMetric
          label="Hit Rate"
          value={pct(s?.outcomes?.winRateExPush)}
          sub={s ? `${s.outcomes?.wins || 0}W · ${s.outcomes?.losses || 0}L · ${outcomeTotal} graded` : '—'}
          accent
        />
      </section>

      {/* Today / Live snapshot */}
      <section>
        <h2 className={styles.sectionTitle}>Live snapshot</h2>
        <div className={styles.statRow}>
          <StatTile
            label="Live Props"
            value={fmt(s?.live?.availableProps)}
            sub="scored & available"
          />
          <StatTile
            label="Games Today"
            value={fmt(s?.live?.scheduledGames)}
            sub="scheduled or live"
          />
          <StatTile
            label="Credits Spent"
            value={fmt(s?.economy?.totalCreditsSpent)}
            sub="all time"
          />
          <StatTile
            label="Revenue"
            value={`$${s?.economy?.totalRevenueUSD || '0.00'}`}
            sub="via Stripe"
            tone="accent"
          />
          <StatTile
            label="High Confidence"
            value={fmt(s?.insights?.highConfidence)}
            sub={insightTotal ? `${Math.round((s.insights.highConfidence / insightTotal) * 100)}% of insights` : '—'}
            tone="accent"
          />
          <StatTile
            label="Best Value"
            value={fmt(s?.insights?.bestValue)}
            sub={insightTotal ? `${Math.round((s.insights.bestValue / insightTotal) * 100)}% of insights` : '—'}
            tone="warning"
          />
        </div>
      </section>

      {/* Per-sport accuracy */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Per-Sport Accuracy</h2>
          <span className={styles.sectionMeta}>Window: last 30 days</span>
        </div>
        <div className={styles.sportGrid}>
          {SPORTS.map(sp => (
            <SportTile key={sp} sport={sp} summary={s?.outcomes?.bySport?.[sp]} />
          ))}
        </div>
      </section>

      {/* Distributions */}
      {s && insightTotal > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Distributions</h2>
          <div className={styles.distGrid}>
            <DistBar
              label="AI Confidence"
              values={s.insights.byConfidence}
              total={insightTotal}
              colorMap={{ high: 'var(--color-accent)', medium: 'var(--color-warning)', low: 'var(--color-danger)' }}
            />
            <DistBar
              label="Data Quality"
              values={s.insights.byDataQuality}
              total={insightTotal}
              colorMap={{ strong: 'var(--color-accent)', moderate: 'var(--color-warning)', weak: 'var(--color-danger)' }}
            />
            <DistBar
              label="Over / Under"
              values={s.insights.byRecommendation}
              total={insightTotal}
              colorMap={{ over: 'var(--color-accent)', under: 'var(--color-info)' }}
            />
            <DistBar
              label="Outcome Split"
              values={s.outcomes?.byResult}
              total={outcomeTotal}
              colorMap={{ win: 'var(--color-accent)', loss: 'var(--color-danger)', push: 'var(--color-warning)' }}
            />
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickGrid}>
          <QuickAction to="/admin/outcomes" icon="📊" label="Outcome Audit"  sub="Per-game accuracy + lifetime archive" />
          <QuickAction to="/admin/users"    icon="👥" label="Manage Users"   sub="Credits, status, transaction history" />
          <QuickAction to="/admin/jobs"     icon="⚙️" label="Run Jobs"       sub="Trigger per-sport sync manually" />
          <QuickAction to="/admin/ai-logs"  icon="📋" label="AI Logs"        sub="Inspect prompts + responses" />
        </div>
      </section>

      {!s && !isLoading && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Could not load stats</p>
          <p className={styles.emptySub}>Check the server is running and try refreshing.</p>
        </div>
      )}
    </div>
  );
}
