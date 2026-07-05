// pages/admin/AdminDashboard.jsx — owner-focused platform overview
//
// Information hierarchy (top → bottom):
//   1. Hero metrics — 3 marquee numbers: Users · Insights · Revenue
//   2. Business snapshot — revenue windows, purchases, refunds, credit inventory
//   3. Platform activity — live props, games today, insights today, HC/BV
//   4. Sport activity — insights + unlock volume per sport
//   5. Top players (last 7d) — most-unlocked players ranked
//   6. Distribution bars — confidence / data quality / over-under
//   7. Quick actions — navigation to admin subpages
//
// Design intent:
//   • Owner-first metrics: revenue, users, engagement — not accuracy.
//   • Accuracy / hit rate / outcome grading lives on the Outcomes tab
//     (developer-only route, not exposed here).
//   • Theme tokens only — no inline colors.
//   • Mono for tabular data, display for marquee numbers.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStats } from '@/hooks/useAdmin';
import styles from './AdminDashboard.module.scss';

const fmt = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });

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

// ── Sport activity tile — shows insights + unlocks per sport ──────────────────
function SportActivityTile({ sport, activity }) {
  const insights = activity?.insights || 0;
  const unlocks  = activity?.unlocks  || 0;
  return (
    <div className={`${styles.sportTile} ${styles[`sportTile_${sport}`]}`}>
      <span className={styles.sportLabel}>{SPORT_LABEL[sport]}</span>
      <span className={styles.sportRate}>{fmt(insights)}</span>
      <span className={styles.sportRecord}>
        {unlocks ? `${fmt(unlocks)} unlocks` : 'no unlocks yet'}
      </span>
    </div>
  );
}

// ── Top-players row ───────────────────────────────────────────────────────────
function TopPlayerRow({ rank, name, sport, unlocks, insights }) {
  return (
    <div className={styles.topPlayerRow}>
      <span className={styles.topPlayerRank}>{rank}</span>
      <div className={styles.topPlayerMain}>
        <span className={styles.topPlayerName}>{name}</span>
        {sport && (
          <span className={`${styles.topPlayerSport} ${styles[`sportTile_${sport}`]}`}>
            {SPORT_LABEL[sport] || sport.toUpperCase()}
          </span>
        )}
      </div>
      <div className={styles.topPlayerStats}>
        <span className={styles.topPlayerUnlocks}>{fmt(unlocks)} unlocks</span>
        <span className={styles.topPlayerInsights}>{fmt(insights)} insights</span>
      </div>
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
  const userTotal    = s?.users?.total    || 0;
  const verifiedPct  = userTotal ? Math.round((s.users.verified / userTotal) * 100) : null;
  const topPlayers   = s?.topPlayers || [];

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

      {/* Hero metrics — Users · Insights · Revenue */}
      <section className={styles.heroGrid}>
        <HeroMetric
          label="Total Users"
          value={fmt(userTotal)}
          sub={s ? `+${s.users.newToday || 0} today · +${s.users.newThisWeek || 0} this week` : '—'}
        />
        <HeroMetric
          label="Insights Generated"
          value={fmt(insightTotal)}
          sub={s ? `${s.insights.generatedToday || 0} today · ${s.insights.generatedThisWeek || 0} this week` : '—'}
        />
        <HeroMetric
          label="Total Revenue"
          value={`$${s?.economy?.totalRevenueUSD || '0.00'}`}
          sub={s ? `$${s.economy.revenueTodayUSD || '0.00'} today · $${s.economy.revenueThisWeekUSD || '0.00'} this week` : '—'}
          accent
        />
      </section>

      {/* Business snapshot — money in / money out / credit inventory */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Business snapshot</h2>
          <span className={styles.sectionMeta}>Lifetime unless noted</span>
        </div>
        <div className={styles.statRow}>
          <StatTile
            label="Revenue Today"
            value={`$${s?.economy?.revenueTodayUSD || '0.00'}`}
            sub={s ? `${s.economy.purchasesToday || 0} purchase${s.economy.purchasesToday === 1 ? '' : 's'} today` : '—'}
            tone="accent"
          />
          <StatTile
            label="Purchases"
            value={fmt(s?.economy?.purchasesTotal)}
            sub="all-time checkouts"
          />
          <StatTile
            label="Refunds"
            value={fmt(s?.economy?.refundsTotal)}
            sub={s ? `$${s.economy.refundsTotalUSD || '0.00'} refunded` : '—'}
            tone={s?.economy?.refundsTotal > 0 ? 'warning' : undefined}
          />
          <StatTile
            label="Credits Held"
            value={fmt(s?.economy?.creditsHeldByUsers)}
            sub="unspent across users"
          />
          <StatTile
            label="Credits Spent"
            value={fmt(s?.economy?.totalCreditsSpent)}
            sub="lifetime unlocks"
          />
          <StatTile
            label="Verified Users"
            value={fmt(s?.users?.verified)}
            sub={verifiedPct != null ? `${verifiedPct}% of total` : 'email verified'}
          />
        </div>
      </section>

      {/* Platform activity — live inventory + engagement pace */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Platform activity</h2>
          <span className={styles.sectionMeta}>Live inventory + today's pace</span>
        </div>
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
            label="Insights Today"
            value={fmt(s?.insights?.generatedToday)}
            sub={s ? `+${s.insights.generatedThisWeek || 0} this week` : '—'}
          />
          <StatTile
            label="Signups Today"
            value={fmt(s?.users?.newToday)}
            sub={s ? `+${s.users.newThisMonth || 0} this month` : '—'}
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

      {/* Sport activity — insight + unlock volume per sport */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Sport activity</h2>
          <span className={styles.sectionMeta}>Insights generated · unlock volume</span>
        </div>
        <div className={styles.sportGrid}>
          {SPORTS.map(sp => (
            <SportActivityTile key={sp} sport={sp} activity={s?.sportActivity?.[sp]} />
          ))}
        </div>
      </section>

      {/* Top players (last 7d) */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top players</h2>
          <span className={styles.sectionMeta}>Most-unlocked · last 7 days</span>
        </div>
        <div className={styles.topPlayerList}>
          {topPlayers.length > 0 ? topPlayers.map((p, i) => (
            <TopPlayerRow
              key={`${p.playerName}-${p.sport || i}`}
              rank={i + 1}
              name={p.playerName}
              sport={p.sport}
              unlocks={p.unlocks}
              insights={p.insights}
            />
          )) : (
            <div className={styles.topPlayerEmpty}>
              No unlocks in the last 7 days yet.
            </div>
          )}
        </div>
      </section>

      {/* Distributions — accuracy stripped, kept only descriptive breakdowns */}
      {s && insightTotal > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Insight distributions</h2>
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
          </div>
        </section>
      )}

      {/* Quick actions — no Outcomes link (developer-only route) */}
      <section>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickGrid}>
          <QuickAction to="/admin/users"    icon="👥" label="Manage Users"   sub="Credits, status, transaction history" />
          <QuickAction to="/admin/insights" icon="🎯" label="Insights"       sub="Browse + delete generated insights" />
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
