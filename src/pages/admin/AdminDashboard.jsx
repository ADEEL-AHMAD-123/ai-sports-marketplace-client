// pages/admin/AdminDashboard.jsx — Overview only, no tabs
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStats } from '@/hooks/useAdmin';
import styles from './AdminDashboard.module.scss';

const fmt  = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const pct  = (n) => n == null ? '—' : `${n}%`;
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatCard({ label, value, sub, tooltip, accent }) {
  return (
    <div className={styles.statCard} title={tooltip || ''}>
      {tooltip && <span className={styles.tipDot}>?</span>}
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue} style={accent ? { color: accent } : {}}>{value ?? '—'}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  );
}

function MiniBar({ label, values, total, colorMap }) {
  if (!total || !values) return null;
  const items = Object.entries(values).map(([k, v]) => ({
    key: k, pct: Math.round((v / total) * 100), count: v,
  })).filter(i => i.pct > 0);

  return (
    <div className={styles.miniBar}>
      <div className={styles.miniBarHead}>
        <span className={styles.miniBarLabel}>{label}</span>
        <span className={styles.miniBarTotal}>{total}</span>
      </div>
      <div className={styles.miniBarTrack}>
        {items.map(({ key, pct }) => (
          <div
            key={key}
            style={{ width: `${pct}%`, background: colorMap?.[key] || 'var(--color-info)' }}
            className={styles.miniBarSeg}
            title={`${key}: ${pct}%`}
          />
        ))}
      </div>
      <div className={styles.miniBarLegend}>
        {items.map(({ key, count, pct }) => (
          <span key={key} className={styles.miniBarItem}>
            <span className={styles.miniBarDot} style={{ background: colorMap?.[key] }} />
            <span className={styles.miniBarKey}>{key}</span>
            <span className={styles.miniBarCount}>{count}</span>
            <span className={styles.miniBarPct}>({pct}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickLinkCard({ icon, label, sub, to, accent }) {
  const navigate = useNavigate();
  return (
    <button className={styles.quickCard} onClick={() => navigate(to)}>
      <span className={styles.quickIcon} style={{ color: accent }}>{icon}</span>
      <div>
        <p className={styles.quickLabel}>{label}</p>
        <p className={styles.quickSub}>{sub}</p>
      </div>
      <span className={styles.quickArrow}>→</span>
    </button>
  );
}

export default function AdminDashboard() {
  const { stats: s, isLoading, lastRefresh } = useAdminStats();

  const insightTotal = s?.insights?.total || 0;
  const outcomeTotal = s?.outcomes?.graded || 0;
  const hcPct = insightTotal ? Math.round((s.insights.highConfidence / insightTotal) * 100) : 0;
  const bvPct = insightTotal ? Math.round((s.insights.bestValue      / insightTotal) * 100) : 0;

  const outcomeBySport = Object.fromEntries(
    Object.entries(s?.outcomes?.bySport || {}).map(([k, v]) => [k, v.graded || 0])
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>
            {isLoading ? 'Refreshing…' : lastRefresh ? `Updated ${timeAgo(lastRefresh)}` : 'Loading…'}
            {' · '}auto-refreshes every 60s
          </p>
        </div>
      </div>

      {/* Platform health */}
      <div className={styles.sectionLabel}>Platform</div>
      <div className={styles.statGrid}>
        <StatCard label="Total Users"    value={fmt(s?.users?.total)}                    sub={`+${s?.users?.newToday??0} today`}                                  tooltip="All registered accounts" />
        <StatCard label="New This Week"  value={fmt(s?.users?.newThisWeek)}               sub="registered"                                                          accent="var(--color-info)" />
        <StatCard label="Credits Spent"  value={fmt(s?.economy?.totalCreditsSpent)}       sub="all time (1 credit = 1 insight)"                                    accent="var(--color-warning)" tooltip="Total credits deducted for insight unlocks" />
        <StatCard label="Revenue"        value={`$${s?.economy?.totalRevenueUSD??'0.00'}`} sub="via Stripe"                                                         accent="var(--color-accent)" tooltip="Total USD collected from credit purchases" />
        <StatCard label="Live Props"     value={fmt(s?.live?.availableProps)}              sub="scored + available now"                                              accent="var(--color-purple)" />
        <StatCard label="Games Today"    value={fmt(s?.live?.scheduledGames)}              sub="scheduled or live (72h window)" />
      </div>

      {/* Insights */}
      <div className={styles.sectionLabel}>Insights</div>
      <div className={styles.statGrid}>
        <StatCard label="Total Generated" value={fmt(insightTotal)}                      sub={`${s?.insights?.generatedToday??0} today · ${s?.insights?.generatedThisWeek??0} this week`} accent="var(--color-info)" tooltip="AI-generated betting insights unlocked by users" />
        <StatCard label="High Confidence" value={`${fmt(s?.insights?.highConfidence)} (${hcPct}%)`} sub="≥57% hit rate"   accent="var(--color-accent)" tooltip="Insights where recent hit rate is high" />
        <StatCard label="Best Value"      value={`${fmt(s?.insights?.bestValue)} (${bvPct}%)`}       sub="≥15% edge vs line" accent="var(--color-warning)" tooltip="Insights where model avg diverges ≥15% from the line" />
        <StatCard label="Avg Edge (30d)"  value={s?.insights?.avgEdge30d != null ? `${s.insights.avgEdge30d}%` : '—'} sub="absolute avg all insights" accent="var(--color-info)" tooltip="Higher = more divergence vs book's line" />
      </div>

      {/* Outcomes */}
      <div className={styles.sectionLabel}>Prediction Outcomes</div>
      <div className={styles.statGrid}>
        <StatCard label="Total Graded"   value={fmt(s?.outcomes?.graded)}                     sub={`${s?.outcomes?.unresolved??0} unresolved`}                    accent="var(--color-info)" tooltip="Resolved outcomes from completed games" />
        <StatCard label="Win Rate"       value={pct(s?.outcomes?.winRateExPush)}               sub={`${s?.outcomes?.wins??0}W · ${s?.outcomes?.losses??0}L · ${s?.outcomes?.pushes??0}P`} accent="var(--color-accent)" tooltip="Win % excluding pushes" />
        <StatCard label="Avg Edge (Wins)" value={s?.outcomes?.avgEdgeOnWins   != null ? `${s.outcomes.avgEdgeOnWins}%` : '—'}   sub={`on ${s?.outcomes?.wins??0} wins`}    accent="var(--color-accent)" />
        <StatCard label="Avg Edge (Loss)" value={s?.outcomes?.avgEdgeOnLosses != null ? `${s.outcomes.avgEdgeOnLosses}%` : '—'} sub={`on ${s?.outcomes?.losses??0} losses`} accent="var(--color-danger)" />
        <StatCard label="NBA Win Rate"   value={pct(s?.outcomes?.bySport?.nba?.winRateExPush)} sub={`${s?.outcomes?.bySport?.nba?.graded??0} graded`}              accent="var(--color-warning)" />
        <StatCard label="MLB Win Rate"   value={pct(s?.outcomes?.bySport?.mlb?.winRateExPush)} sub={`${s?.outcomes?.bySport?.mlb?.graded??0} graded`}              accent="var(--color-purple)" />
        <StatCard label="NHL Win Rate"   value={pct(s?.outcomes?.bySport?.nhl?.winRateExPush)} sub={`${s?.outcomes?.bySport?.nhl?.graded??0} graded`}              accent="var(--color-info)" />
        <StatCard label="HC Hit Rate"    value={pct(s?.outcomes?.byConfidence?.['80-100']?.winRateExPush)} sub={`${s?.outcomes?.byConfidence?.['80-100']?.graded??0} in 80-100 band`} accent="var(--color-accent)" tooltip="Win rate for high-confidence scored insights" />
      </div>

      {/* Distribution bars */}
      {s && insightTotal > 0 && (
        <>
          <div className={styles.sectionLabel}>Distributions</div>
          <div className={styles.distRow}>
            <MiniBar
              label="AI Confidence"
              values={s.insights.byConfidence}
              total={insightTotal}
              colorMap={{ high: 'var(--color-accent)', medium: 'var(--color-warning)', low: 'var(--color-danger)' }}
            />
            <MiniBar
              label="Data Quality"
              values={s.insights.byDataQuality}
              total={insightTotal}
              colorMap={{ strong: 'var(--color-accent)', moderate: 'var(--color-warning)', weak: 'var(--color-danger)' }}
            />
            <MiniBar
              label="Over / Under"
              values={s.insights.byRecommendation}
              total={insightTotal}
              colorMap={{ over: 'var(--color-accent)', under: 'var(--color-info)' }}
            />
            <MiniBar
              label="Outcome Split"
              values={s.outcomes?.byResult}
              total={outcomeTotal}
              colorMap={{ win: 'var(--color-accent)', loss: 'var(--color-danger)', push: 'var(--color-warning)' }}
            />
          </div>
        </>
      )}

      {/* Quick nav */}
      <div className={styles.sectionLabel}>Quick Actions</div>
      <div className={styles.quickGrid}>
        <QuickLinkCard to="/admin/outcomes" icon="📊" label="Outcome Audit"   sub="Full graded results + per-game performance"  accent="var(--color-accent)" />
        <QuickLinkCard to="/admin/users"    icon="👥" label="Manage Users"    sub="Credits, activation, transaction history"     accent="var(--color-info)" />
        <QuickLinkCard to="/admin/players"  icon="🆔" label="Player ID Cache" sub="Resolve, inspect, clear stale player IDs"    accent="var(--color-warning)" />
        <QuickLinkCard to="/admin/jobs"     icon="⚙️" label="Run Jobs"        sub="Trigger per-sport or full sync manually"     accent="var(--color-purple)" />
        <QuickLinkCard to="/admin/ai-logs"  icon="📋" label="AI Logs"         sub="Inspect AI prompt/response for each insight" accent="var(--color-text-muted)" />
      </div>

      {!s && !isLoading && (
        <div className={styles.emptyState}>Could not load stats — check the server.</div>
      )}
    </div>
  );
}