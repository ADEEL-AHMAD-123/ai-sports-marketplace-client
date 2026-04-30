// pages/admin/AdminDashboard.jsx
// Uses useAdminStats() from useAdmin.js — no inline fetch logic here
import React, { useState } from 'react';

import { useAdminStats }    from '@/hooks/useAdmin';
import StatCard             from '@/components/admin/StatCard';
import DistBar              from '@/components/admin/DistBar';
import PredictionRow        from '@/components/admin/PredictionRow';
import OutcomeRow           from '@/components/admin/OutcomeRow';
import PlayerHealthPanel    from '@/components/admin/PlayerHealthPanel';
import CronPanel            from '@/components/admin/CronPanel';

import styles from './AdminDashboard.module.scss';

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const pct = (n) => n == null ? '—' : `${n}%`;

function getConfidenceBand(c) {
  const n = Number(c);
  if (!isFinite(n)) return 'unknown';
  if (n >= 80) return '80-100';
  if (n >= 60) return '60-79';
  return '0-59';
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TABS = [
  { key: 'overview',    label: 'Overview',    icon: '⊞' },
  { key: 'predictions', label: 'Predictions', icon: '📊' },
  { key: 'players',     label: 'Player IDs',  icon: '🆔' },
  { key: 'crons',       label: 'Jobs',        icon: '⚙' },
];

function PendingOutcomeRow({ row }) {
  const isOver    = row.rec === 'over';
  const titleize  = (v) => v ? String(v).replace(/_/g, ' ') : '—';
  return (
    <div className={styles.outcomeRow}>
      <div className={styles.outcomePlayer}>
        <span className={styles.outcomeName}>{row.playerName}</span>
        <span className={styles.outcomeMeta}>{(row.sport||'—').toUpperCase()} · {titleize(row.statType)} · Line {row.line}</span>
      </div>
      <span className={`${styles.predRec} ${isOver ? styles.recOver : styles.recUnder}`}>
        {isOver ? '▲' : '▼'} {row.rec?.toUpperCase()} {row.line}
      </span>
      <span className={styles.outcomeActual}>—</span>
      <span className={`${styles.outcomeResult} ${styles.resultPending}`}>pending</span>
      <span className={styles.outcomeMetric}>—</span>
      <span className={styles.outcomeMetric}>—</span>
      <span className={styles.predTime}>{row.createdAt ? timeAgo(row.createdAt) : '—'}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  // All data + refresh + cron trigger come from one hook — no apiFetch here
  const { stats: s, isLoading, triggerCron, lastRefresh } = useAdminStats();

  const [activeTab,        setActiveTab]        = useState('overview');
  const [sportFilter,      setSportFilter]      = useState('all');
  const [resultFilter,     setResultFilter]     = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [outcomeSearch,    setOutcomeSearch]    = useState('');

  const insightTotal = s?.insights?.total || 0;
  const outcomeTotal = s?.outcomes?.graded || 0;
  const hcPct = insightTotal ? Math.round((s.insights.highConfidence / insightTotal) * 100) : 0;
  const bvPct = insightTotal ? Math.round((s.insights.bestValue      / insightTotal) * 100) : 0;

  const outcomeBySport      = Object.fromEntries(Object.entries(s?.outcomes?.bySport      || {}).map(([k,v]) => [k, v.graded||0]));
  const outcomeByConfidence = Object.fromEntries(Object.entries(s?.outcomes?.byConfidence || {}).map(([k,v]) => [k, v.graded||0]));

  const filterRow = (row) => {
    const q = outcomeSearch.trim().toLowerCase();
    if (q && !`${row.playerName||''} ${row.statType||''} ${row.sport||''}`.toLowerCase().includes(q)) return false;
    if (sportFilter      !== 'all' && row.sport !== sportFilter)                       return false;
    if (confidenceFilter !== 'all' && getConfidenceBand(row.confidence) !== confidenceFilter) return false;
    return true;
  };

  const resolvedRows = (s?.outcomes?.sampleResolved || [])
    .filter(r => filterRow(r) && (resultFilter === 'all' || r.result === resultFilter));
  const pendingRows  = [
    ...(s?.outcomes?.sampleUnresolved || []),
    ...(s?.outcomes?.samplePending    || []),
  ].filter(r => filterRow(r) && ['all','pending'].includes(resultFilter));

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>
            {lastRefresh ? `Last updated ${timeAgo(lastRefresh)}` : 'Loading…'} · auto-refreshes every 60s
          </p>
        </div>
        <div className={styles.tabBar}>
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`${styles.tabBtn} ${activeTab === key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className={styles.tabIcon}>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionLabel}>Platform Health</div>
          <div className={styles.statGrid}>
            <StatCard label="Total Users"    value={fmt(s?.users?.total)}               sub={`+${s?.users?.newToday??0} today · +${s?.users?.newThisWeek??0} this week`}    tooltip="All registered accounts" />
            <StatCard label="Total Insights" value={fmt(insightTotal)}                  sub={`${s?.insights?.generatedToday??0} today`}                                       tooltip="AI-generated betting insights" accentColor="var(--color-info)" />
            <StatCard label="Credits Spent"  value={fmt(s?.economy?.totalCreditsSpent)} sub="all time"                                                                        tooltip="Total credits deducted for unlocks" accentColor="var(--color-warning)" />
            <StatCard label="Revenue"        value={`$${s?.economy?.totalRevenueUSD??'0.00'}`} sub="from Stripe"                                                              tooltip="Total USD from credit purchases" accentColor="var(--color-accent)" />
            <StatCard label="Live Props"     value={fmt(s?.live?.availableProps)}        sub="scored and ready"                                                                tooltip="Props visible to users right now" accentColor="var(--color-purple)" />
            <StatCard label="Games Today"    value={fmt(s?.live?.scheduledGames)}        sub="scheduled or live"                                                               tooltip="Games within the next 72h" />
            <StatCard label="HC Insights"    value={`${fmt(s?.insights?.highConfidence)} (${hcPct}%)`} sub="high confidence"                                                  tooltip="Hit rate ≥ 80% in last 5 games" accentColor="var(--color-accent)" />
            <StatCard label="BV Insights"    value={`${fmt(s?.insights?.bestValue)} (${bvPct}%)`}      sub="best value"                                                       tooltip="10-game avg ≥ 15% above/below line" accentColor="var(--color-warning)" />
            <StatCard label="Avg Edge (30d)" value={s?.insights?.avgEdge30d != null ? `${s.insights.avgEdge30d}%` : '—'} sub="absolute avg across all insights"              tooltip="Higher = more divergence vs book's line" accentColor="var(--color-info)" />
          </div>

          <div className={styles.sectionLabel}>Prediction Outcomes</div>
          <div className={styles.statGrid}>
            <StatCard label="Graded"          value={fmt(s?.outcomes?.graded)}                                         sub={`${s?.outcomes?.unresolved??0} unresolved`}           tooltip="Resolved outcomes"             accentColor="var(--color-info)" />
            <StatCard label="Win Rate"        value={pct(s?.outcomes?.winRateExPush)}                                  sub={`${s?.outcomes?.wins??0}W · ${s?.outcomes?.losses??0}L · ${s?.outcomes?.pushes??0}P`} tooltip="Win % excluding pushes" accentColor="var(--color-accent)" />
            <StatCard label="NBA Win Rate"    value={pct(s?.outcomes?.bySport?.nba?.winRateExPush)}                    sub={`${s?.outcomes?.bySport?.nba?.graded??0} graded`}      tooltip="NBA resolved win rate"         accentColor="var(--color-warning)" />
            <StatCard label="MLB Win Rate"    value={pct(s?.outcomes?.bySport?.mlb?.winRateExPush)}                    sub={`${s?.outcomes?.bySport?.mlb?.graded??0} graded`}      tooltip="MLB resolved win rate"         accentColor="var(--color-purple)" />
            <StatCard label="NHL Win Rate"    value={pct(s?.outcomes?.bySport?.nhl?.winRateExPush)}                    sub={`${s?.outcomes?.bySport?.nhl?.graded??0} graded`}      tooltip="NHL resolved win rate"         accentColor="var(--color-info)" />
            <StatCard label="HC Hit Rate"     value={pct(s?.outcomes?.byConfidence?.['80-100']?.winRateExPush)}        sub={`${s?.outcomes?.byConfidence?.['80-100']?.graded??0} in 80-100 band`} tooltip="High-confidence win rate" accentColor="var(--color-accent)" />
            <StatCard label="Avg Edge (Wins)" value={s?.outcomes?.avgEdgeOnWins   != null ? `${s.outcomes.avgEdgeOnWins}%`   : '—'} sub={`${s?.outcomes?.wins??0} winning insights`}  tooltip="Avg edge on wins"   accentColor="var(--color-accent)" />
            <StatCard label="Avg Edge (Loss)" value={s?.outcomes?.avgEdgeOnLosses != null ? `${s.outcomes.avgEdgeOnLosses}%` : '—'} sub={`${s?.outcomes?.losses??0} losing insights`} tooltip="Avg edge on losses" accentColor="var(--color-danger)" />
          </div>

          {s && insightTotal > 0 && (
            <>
              <div className={styles.sectionLabel}>Insight Distributions</div>
              <div className={styles.distGrid}>
                <DistBar label="AI Confidence"     values={s.insights.byConfidence}     total={insightTotal} colorMap={{ high:'var(--color-accent)',   medium:'var(--color-warning)', low:'var(--color-danger)' }}  tooltip="high/medium/low AI self-assessment" />
                <DistBar label="Data Quality"      values={s.insights.byDataQuality}    total={insightTotal} colorMap={{ strong:'var(--color-accent)', moderate:'var(--color-warning)', weak:'var(--color-danger)' }} tooltip="strong=all 3 windows full" />
                <DistBar label="Over vs Under"     values={s.insights.byRecommendation} total={insightTotal} colorMap={{ over:'var(--color-accent)',   under:'var(--color-info)' }}   tooltip="Healthy split = ~50/50" />
              </div>
              <div className={styles.distGrid}>
                <DistBar label="Outcome Split"      values={s.outcomes?.byResult}   total={outcomeTotal} colorMap={{ win:'var(--color-accent)', loss:'var(--color-danger)', push:'var(--color-warning)' }} tooltip="Win/loss/push from graded" />
                <DistBar label="Graded By Sport"    values={outcomeBySport}          total={outcomeTotal} colorMap={{ nba:'var(--color-warning)', mlb:'var(--color-purple)', nhl:'var(--color-info)' }}   tooltip="Sample split across sports" />
                <DistBar label="By Confidence Band" values={outcomeByConfidence}     total={outcomeTotal} colorMap={{ '80-100':'var(--color-accent)', '60-79':'var(--color-warning)', '0-59':'var(--color-danger)' }} tooltip="Resolved per confidence band" />
              </div>
            </>
          )}

          {!s && !isLoading && (
            <div className={styles.emptyState}>
              <p>Could not load stats. Check the server is running.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Predictions ── */}
      {activeTab === 'predictions' && (
        <div className={styles.tabContent}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <h2 className={styles.panelTitle}>Recent Predictions</h2>
              <p className={styles.panelDesc}>The 20 most recently generated insights. <strong>Edge %</strong> = divergence from book's line. <strong>HC</strong> = 80%+ hit rate. <strong>BV</strong> = edge ≥ 15%.</p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <div className={`${styles.tableHead} ${styles.predTableHead}`}>
              <span>Player · Stat · Line</span><span>Signal</span><span>Edge %</span><span>AI Conf</span><span>Tags</span><span>When</span>
            </div>
            {isLoading ? (
              <div className={styles.tableMsg}>Loading…</div>
            ) : !(s?.recentInsights?.length) ? (
              <div className={styles.tableMsg}>No insights yet. Users need to unlock props first.</div>
            ) : (
              (s.recentInsights || []).map(i => <PredictionRow key={i._id} insight={i} />)
            )}
          </div>

          {/* Outcome audit */}
          <div className={styles.panelHeader} style={{ marginTop: '28px' }}>
            <div className={styles.panelTitleGroup}>
              <h2 className={styles.panelTitle}>Outcome Audit</h2>
              <p className={styles.panelDesc}>Graded predictions matched against actual player stats.</p>
              <div className={styles.panelStats}>
                <span className={styles.panelStat}><strong>{s?.outcomes?.graded??0}</strong> graded</span>
                <span className={styles.panelStat}><strong>{s?.outcomes?.wins??0}</strong> wins</span>
                <span className={styles.panelStat}><strong>{s?.outcomes?.losses??0}</strong> losses</span>
                <span className={styles.panelStat}><strong>{s?.outcomes?.unresolved??0}</strong> pending</span>
              </div>
            </div>
            <div className={styles.panelControls}>
              <input
                className={styles.searchInput}
                placeholder="Search player, stat, sport…"
                value={outcomeSearch}
                onChange={e => setOutcomeSearch(e.target.value)}
              />
              <select className={styles.sortSelect} value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
                <option value="all">Sport: All</option>
                <option value="nba">NBA</option>
                <option value="mlb">MLB</option>
                <option value="nhl">NHL</option>
              </select>
              <select className={styles.sortSelect} value={resultFilter} onChange={e => setResultFilter(e.target.value)}>
                <option value="all">Result: All</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="push">Push</option>
                <option value="pending">Pending</option>
              </select>
              <select className={styles.sortSelect} value={confidenceFilter} onChange={e => setConfidenceFilter(e.target.value)}>
                <option value="all">Conf: All</option>
                <option value="80-100">80–100</option>
                <option value="60-79">60–79</option>
                <option value="0-59">0–59</option>
              </select>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <div className={`${styles.tableHead} ${styles.outcomeTableHead}`}>
              <span>Player · Sport · Stat</span><span>Pick</span><span>Actual</span><span>Result</span><span>Conf</span><span>Edge</span><span>When</span>
            </div>
            {resolvedRows.length === 0 ? (
              <div className={styles.tableMsg}>
                {!(s?.outcomes?.sampleResolved?.length) ? 'No resolved outcomes yet.' : 'No rows match current filters.'}
              </div>
            ) : resolvedRows.map(row => (
              <OutcomeRow key={`${row.eventId}_${row.playerName}_${row.statType}`} row={row} />
            ))}
          </div>

          {pendingRows.length > 0 && (
            <div className={styles.tableWrap} style={{ marginTop: '14px' }}>
              <div className={`${styles.tableHead} ${styles.outcomeTableHead}`}>
                <span>Pending Player</span><span>Pick</span><span>Actual</span><span>Status</span><span>Conf</span><span>Edge</span><span>When</span>
              </div>
              {pendingRows.map(row => (
                <PendingOutcomeRow key={`${row.eventId}_${row.playerName}_${row.statType}_p`} row={row} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'players' && <PlayerHealthPanel />}
      {activeTab === 'crons'   && <CronPanel onTrigger={triggerCron} />}
    </div>
  );
}