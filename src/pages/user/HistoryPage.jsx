// src/pages/user/HistoryPage.jsx
//
// User's personal prediction history — every insight they've unlocked,
// grouped by outcome state so they can quickly see what hit and what missed.
//
// Information hierarchy:
//   1. Header — title + subtitle with total count
//   2. KPI strip — Total / Wins / Pending / Hit rate
//   3. Filter row — All · HC · BV · Won · Lost · Pending (chips)
//   4. Card list — each insight as a self-contained card,
//      click to expand for AI summary + factors + risks
//   5. Pagination

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectToken } from '@/store/slices/authSlice';
import s from './HistoryPage.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const API = (path) => `${API_BASE}${path}`;

const SPORT_LABEL = { nba: 'NBA', mlb: 'MLB', nhl: 'NHL', nfl: 'NFL', soccer: 'Soccer' };

const titleize = (v) => v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
const fmt      = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });

function timeAgo(date) {
  if (!date) return '—';
  const sec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

// ── KPI tile ──────────────────────────────────────────────────────────────────
function Kpi({ label, value, sub, accent }) {
  return (
    <div className={`${s.kpi} ${accent ? s.kpiAccent : ''}`}>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
      {sub && <span className={s.kpiSub}>{sub}</span>}
    </div>
  );
}

// ── Sport pill ────────────────────────────────────────────────────────────────
function SportPill({ sport }) {
  if (!sport) return null;
  return <span className={`${s.sportPill} ${s[`sportPill_${sport}`] || ''}`}>{SPORT_LABEL[sport] || sport.toUpperCase()}</span>;
}

// ── Outcome pill ──────────────────────────────────────────────────────────────
function OutcomePill({ result }) {
  if (!result || result === 'unresolved' || result === null) {
    return <span className={`${s.outcomePill} ${s.outcomePending}`}>Pending</span>;
  }
  const map = {
    win:   { cls: s.outcomeWin,  label: '✓ HIT' },
    loss:  { cls: s.outcomeLoss, label: '✗ MISS' },
    push:  { cls: s.outcomePush, label: 'PUSH' },
    void:  { cls: s.outcomeVoid, label: 'VOID' },
  };
  const m = map[result] || { cls: s.outcomePending, label: result };
  return <span className={`${s.outcomePill} ${m.cls}`}>{m.label}</span>;
}

// ── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const isOver  = insight.recommendation === 'over';
  const edge    = parseFloat(insight.edgePercentage || 0);
  const edgeStr = Number.isFinite(edge) && edge !== 0
    ? `${edge >= 0 ? '+' : ''}${edge.toFixed(1)}%` : null;
  const conf    = insight.confidenceScore;
  const result  = insight.outcomeResult;
  const actual  = insight.outcomeActual;

  // Color the player name's left accent bar by outcome
  const accentCls =
    result === 'win'  ? s.cardWin  :
    result === 'loss' ? s.cardLoss :
    result === 'push' ? s.cardPush : s.cardPending;

  return (
    <div className={`${s.card} ${accentCls} ${expanded ? s.cardExpanded : ''}`}>
      <button
        className={s.cardMain}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {/* Left: player + stat + line */}
        <div className={s.cardLeft}>
          <div className={s.cardLeftTop}>
            <SportPill sport={insight.sport} />
            <span className={s.cardTime}>{timeAgo(insight.createdAt)}</span>
          </div>
          <span className={s.playerName}>{insight.playerName}</span>
          <span className={s.statRow}>
            <span className={s.statType}>{titleize(insight.statType)}</span>
            <span className={s.statSep}>·</span>
            <span className={isOver ? s.recOver : s.recUnder}>
              {isOver ? '▲ OVER' : '▼ UNDER'} <strong>{insight.bettingLine}</strong>
            </span>
          </span>
        </div>

        {/* Right: outcome + metrics */}
        <div className={s.cardRight}>
          <OutcomePill result={result} />
          <div className={s.cardMetrics}>
            {actual != null && (
              <span className={s.metricItem}>
                <span className={s.metricLabel}>Actual</span>
                <span className={s.metricValue}>{fmt(actual, 1)}</span>
              </span>
            )}
            {edgeStr && (
              <span className={s.metricItem}>
                <span className={s.metricLabel}>Edge</span>
                <span className={`${s.metricValue} ${edge >= 0 ? s.edgePos : s.edgeNeg}`}>{edgeStr}</span>
              </span>
            )}
            {conf != null && (
              <span className={s.metricItem}>
                <span className={s.metricLabel}>Conf</span>
                <span className={s.metricValue}>{Math.round(conf)}%</span>
              </span>
            )}
          </div>
          <div className={s.cardTags}>
            {insight.isHighConfidence && <span className={s.tagHC}>HC</span>}
            {insight.isBestValue      && <span className={s.tagBV}>BV</span>}
          </div>
        </div>

        <span className={`${s.cardCaret} ${expanded ? s.cardCaretOpen : ''}`} aria-hidden="true">▾</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className={s.cardDetail}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={s.cardDetailInner}>
              {insight.insightSummary && (
                <p className={s.summary}>{insight.insightSummary}</p>
              )}

              {insight.insightFactors?.length > 0 && (
                <div className={s.factors}>
                  <span className={s.detailHeading}>Supporting Factors</span>
                  <ul className={s.factorList}>
                    {insight.insightFactors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {insight.insightRisks?.length > 0 && (
                <div className={s.risks}>
                  <span className={s.detailHeading}>Risk Factors</span>
                  <ul className={s.riskList}>
                    {insight.insightRisks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const token = useSelector(selectToken);
  const [insights, setInsights]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [filter, setFilter]       = useState('all');
  // Lifetime stats — fetched once per filter cycle so KPIs and chip counts
  // reflect the user's entire unlocked history, not just the current page.
  const [stats, setStats]         = useState(null);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, stats: 1 });
      // Backend now handles ALL filters server-side, including outcome filters
      // (won/lost/pending/pushed) — so pagination stays accurate.
      if (filter !== 'all') params.set('filter', filter);

      const res  = await fetch(API(`/insights/my-history?${params}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setInsights(data.data || []);
        setTotal(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, token]);

  useEffect(() => { load(); }, [load]);

  // Server already filtered — no client-side outcome pass needed.
  const visible = insights;

  // KPIs come from the lifetime stats block when available; fall back to a
  // current-page approximation if the stats payload hasn't arrived yet.
  const kpis = useMemo(() => {
    if (stats) {
      return {
        won:     stats.won     || 0,
        lost:    stats.lost    || 0,
        pushed:  stats.pushed  || 0,
        pending: stats.pending || 0,
        hitRate: stats.hitRate,
      };
    }
    const won     = insights.filter(i => i.outcomeResult === 'win').length;
    const lost    = insights.filter(i => i.outcomeResult === 'loss').length;
    const pushed  = insights.filter(i => i.outcomeResult === 'push').length;
    const pending = insights.filter(i => !['win', 'loss', 'push', 'void'].includes(i.outcomeResult)).length;
    const decisive = won + lost;
    return {
      won, lost, pushed, pending,
      hitRate: decisive ? Math.round((won * 100) / decisive) : null,
    };
  }, [stats, insights]);

  // The "All" total should always reflect the lifetime unlocked count, even
  // when an outcome filter is active and `total` only counts that subset.
  const lifetimeTotal = stats?.total ?? total;
  const totalPages    = Math.max(1, Math.ceil(total / LIMIT));

  const FILTERS = [
    { key: 'all',            label: 'All',             count: lifetimeTotal || null },
    { key: 'highConfidence', label: 'High Confidence', count: stats?.highConfidence || null },
    { key: 'bestValue',      label: 'Best Value',      count: stats?.bestValue      || null },
    { key: 'won',            label: 'Won',             count: kpis.won     || null },
    { key: 'lost',           label: 'Lost',            count: kpis.lost    || null },
    { key: 'pending',        label: 'Pending',         count: kpis.pending || null },
  ];

  return (
    <div className={s.page}>

      {/* Header */}
      <header className={s.header}>
        <div className={s.headerMain}>
          <span className={s.eyebrow}>Your Activity</span>
          <h1 className={s.title}>My Predictions</h1>
          <p className={s.subtitle}>
            {lifetimeTotal > 0
              ? `${fmt(lifetimeTotal)} insight${lifetimeTotal === 1 ? '' : 's'} unlocked — track which calls hit, which missed, and what's still pending.`
              : 'Every insight you unlock lands here — with results once games finalize.'}
          </p>
        </div>
      </header>

      {/* KPI strip */}
      {lifetimeTotal > 0 && (
        <section className={s.kpiRow}>
          <Kpi label="Hit Rate"
               value={kpis.hitRate != null ? `${kpis.hitRate}%` : '—'}
               sub={(kpis.won + kpis.lost) > 0
                 ? `${kpis.won}W · ${kpis.lost}L${kpis.pushed ? ` · ${kpis.pushed}P` : ''}`
                 : 'no graded picks yet'}
               accent />
          <Kpi label="Total Unlocked" value={fmt(lifetimeTotal)} sub="lifetime" />
          <Kpi label="Wins"           value={fmt(kpis.won)}     sub="lifetime" />
          <Kpi label="Pending"        value={fmt(kpis.pending)} sub="awaiting outcome" />
        </section>
      )}

      {/* Filter row */}
      <nav className={s.filterRow} aria-label="Filter predictions">
        {FILTERS.map(({ key, label, count }) => (
          <button
            key={key}
            className={`${s.filterChip} ${filter === key ? s.filterActive : ''}`}
            onClick={() => { setFilter(key); setPage(1); }}
            aria-pressed={filter === key}
          >
            <span>{label}</span>
            {count != null && count > 0 && (
              <span className={s.filterCount}>{count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Card list */}
      {loading ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>Loading your predictions…</p>
        </div>
      ) : visible.length === 0 ? (
        lifetimeTotal === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>📊</span>
            <p className={s.emptyTitle}>No predictions yet</p>
            <p className={s.emptySub}>Unlock insights from the home screen and they'll appear here with live grading.</p>
          </div>
        ) : (
          <div className={s.empty}>
            <p className={s.emptyTitle}>Nothing matches this filter</p>
            <p className={s.emptySub}>
              No insights match the <strong>{(FILTERS.find(f => f.key === filter)?.label) || filter}</strong> filter yet.
              {filter !== 'all' && (
                <>
                  {' '}
                  <button className={s.emptyClearBtn} onClick={() => { setFilter('all'); setPage(1); }}>
                    Clear filter
                  </button>
                </>
              )}
            </p>
          </div>
        )
      ) : (
        <div className={s.list}>
          {visible.map(insight => (
            <InsightCard key={insight._id} insight={insight} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={s.pagination}>
          <button className={s.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className={s.pageInfo}>Page {page} of {totalPages}</span>
          <button className={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
