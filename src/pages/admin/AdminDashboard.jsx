// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/slices/authSlice';
import styles from './AdminDashboard.module.scss';

// ── Constants ─────────────────────────────────────────────────────────────────

const CRON_JOBS = [
  {
    key: 'morning-scraper',
    label: 'Morning Scraper',
    icon: '📅',
    desc: "Fetches today's NBA games from The Odds API and saves them to MongoDB.",
    when: 'Runs automatically at 7AM UTC every day.',
  },
  {
    key: 'prop-watcher',
    label: 'Prop Watcher',
    icon: '👁',
    desc: 'Fetches all player props for today\'s games, resolves player IDs, and scores props (edge %, confidence). Marks props with < 10 games of data as unavailable.',
    when: 'Runs every 30 minutes. Costs Odds API quota credits.',
  },
  {
    key: 'post-game-sync',
    label: 'Post-Game Sync',
    icon: '🔄',
    desc: 'Marks completed games as finished. Planned: will record actual player stats to enable prediction outcome tracking.',
    when: 'Runs nightly after games complete. (Outcome tracking coming soon.)',
  },
  {
    key: 'ai-log-cleanup',
    label: 'AI Log Cleanup',
    icon: '🗑',
    desc: 'Removes AI prompt/response logs older than 30 days from MongoDB to save storage. Does NOT delete the insights themselves.',
    when: 'Safe to run any time.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt  = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const pct  = (n) => n == null ? '—' : `${n}%`;

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function apiFetch(path, token, opts = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, tooltip, accentColor }) {
  return (
    <div className={styles.statCard} title={tooltip || ''}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue} style={accentColor ? { color: accentColor } : {}}>
        {value ?? '—'}
      </p>
      {sub && <p className={styles.statSub}>{sub}</p>}
      {tooltip && <span className={styles.statTooltip}>?</span>}
    </div>
  );
}

function DistBar({ label, tooltip, values, total, colorMap }) {
  if (!total) return (
    <div className={styles.distBar}>
      <p className={styles.distLabel}>{label}</p>
      <p className={styles.distEmpty}>No data yet</p>
    </div>
  );

  const items = Object.entries(values).map(([k, v]) => ({
    key: k, count: v, pct: Math.round((v / total) * 100),
  }));

  return (
    <div className={styles.distBar} title={tooltip || ''}>
      <div className={styles.distHead}>
        <p className={styles.distLabel}>{label}</p>
        <span className={styles.distTotal}>{total} total</span>
      </div>
      <div className={styles.distTrack}>
        {items.map(({ key, pct }) =>
          pct > 0 && (
            <div
              key={key}
              className={styles.distSeg}
              style={{ width: `${pct}%`, background: colorMap?.[key] || 'var(--color-info)' }}
              title={`${key}: ${pct}%`}
            />
          )
        )}
      </div>
      <div className={styles.distLegend}>
        {items.map(({ key, count, pct }) => (
          <span key={key} className={styles.distItem}>
            <span className={styles.distDot} style={{ background: colorMap?.[key] || 'var(--color-info)' }} />
            <span className={styles.distKey}>{key}</span>
            <span className={styles.distCount}>{count}</span>
            <span className={styles.distPct}>({pct}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function PredictionRow({ insight }) {
  const edge = parseFloat(insight.edgePercentage || 0);
  const isOver = insight.recommendation === 'over';
  const absEdge = Math.abs(edge);

  return (
    <div className={styles.predRow}>
      <div className={styles.predPlayer}>
        <span className={styles.predName}>{insight.playerName}</span>
        <span className={styles.predStat}>{insight.statType} · Line {insight.bettingLine}</span>
      </div>
      <span className={`${styles.predRec} ${isOver ? styles.recOver : styles.recUnder}`}>
        {isOver ? '▲' : '▼'} {insight.recommendation?.toUpperCase()} {insight.bettingLine}
      </span>
      <span className={`${styles.predEdge} ${absEdge >= 15 ? styles.edgeStrong : absEdge >= 8 ? styles.edgeMed : ''}`}>
        {edge >= 0 ? '+' : ''}{edge.toFixed(1)}%
      </span>
      <span className={`${styles.predConf} ${styles[`conf_${insight.aiConfidenceLabel}`]}`}>
        {insight.aiConfidenceLabel || '—'}
      </span>
      <div className={styles.predTags}>
        {insight.isHighConfidence && <span className={styles.tagHC} title="High Confidence: hit rate ≥ 80% in last 5 games">HC</span>}
        {insight.isBestValue     && <span className={styles.tagBV} title="Best Value: edge ≥ 15% vs the book's line">BV</span>}
      </div>
      <span className={styles.predTime}>{timeAgo(insight.createdAt)}</span>
    </div>
  );
}

function PlayerHealthPanel({ token }) {
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [clearing, setClearing] = useState(null);
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('name'); // name | props | id

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await apiFetch('/admin/players/health?sport=nba&limit=200', token);
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const clearCache = async (name) => {
    if (!window.confirm(`Clear NBA ID cache for "${name}"?\n\nThis player's ID will be re-resolved automatically on the next Prop Watcher run.`)) return;
    setClearing(name);
    try {
      await apiFetch(`/admin/players/${encodeURIComponent(name)}/cache?sport=nba`, token, { method: 'DELETE' });
      await load();
    } finally { setClearing(null); }
  };

  const filtered = players
    .filter(p =>
      !search ||
      p.oddsApiName.includes(search.toLowerCase()) ||
      String(p.apiSportsId || '').includes(search) ||
      (p.resolvedName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'props') return (b.activePropCount || 0) - (a.activePropCount || 0);
      if (sortBy === 'id')    return (a.apiSportsId || 0) - (b.apiSportsId || 0);
      return a.oddsApiName.localeCompare(b.oddsApiName);
    });

  const overrideCount = players.filter(p => p.isOverride).length;
  const activeCount   = players.filter(p => p.activePropCount > 0).length;

  return (
    <div className={styles.panelSection}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>Player ID Cache</h2>
          <p className={styles.panelDesc}>
            When a player prop is fetched, EdgeIQ looks up their NBA stats API numeric ID and caches it here permanently.
            If a player shows 0 stats or wrong data, clear their cache to force a fresh ID lookup.
          </p>
          <div className={styles.panelStats}>
            <span className={styles.panelStat}><strong>{players.length}</strong> cached</span>
            <span className={styles.panelStat}><strong>{activeCount}</strong> with active props</span>
            <span className={styles.panelStat}><strong>{overrideCount}</strong> manual overrides</span>
          </div>
        </div>
        <div className={styles.panelControls}>
          <input
            className={styles.searchInput}
            placeholder="Search name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="props">Sort: Active Props</option>
            <option value="id">Sort: ID</option>
          </select>
          <button className={styles.refreshBtn} onClick={load} title="Refresh list">↻</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <span>Odds API Name</span>
          <span>Resolved Name</span>
          <span>NBA Stats ID</span>
          <span>Team</span>
          <span title="Number of live active props for this player">Props</span>
          <span title="auto = resolved by name matching · manual = set via PLAYER_ID_OVERRIDES_JSON in .env">Type</span>
          <span>Action</span>
        </div>
        {loading ? (
          <div className={styles.tableMsg}>Loading player cache…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.tableMsg}>{search ? `No results for "${search}"` : 'No players cached yet — run Prop Watcher first'}</div>
        ) : (
          filtered.map(p => (
            <div key={p.oddsApiName} className={`${styles.tableRow} ${p.activePropCount > 0 ? styles.rowActive : ''}`}>
              <span className={styles.cellName}>{p.oddsApiName}</span>
              <span className={styles.cellResolved}>{p.resolvedName || p.apiSportsName?.replace('override:', '') || '—'}</span>
              <span className={styles.cellId}>{p.apiSportsId}</span>
              <span className={styles.cellTeam}>{p.teamName || '—'}</span>
              <span className={styles.cellProps}>
                {p.activePropCount > 0
                  ? <span className={styles.propsActive}>{p.activePropCount}</span>
                  : <span className={styles.propsNone}>0</span>}
              </span>
              <span className={styles.cellType}>
                {p.isOverride
                  ? <span className={styles.tagOverride} title="ID set manually via PLAYER_ID_OVERRIDES_JSON in .env">manual</span>
                  : <span className={styles.tagAuto}    title="ID resolved automatically by name matching">auto</span>}
              </span>
              <button
                className={styles.clearBtn}
                onClick={() => clearCache(p.oddsApiName)}
                disabled={clearing === p.oddsApiName || p.isOverride}
                title={p.isOverride ? 'Manual overrides cannot be cleared here — edit .env' : 'Clear cached ID and re-resolve on next Prop Watcher run'}
              >
                {clearing === p.oddsApiName ? '…' : 'Clear'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const token = useSelector(selectToken);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cronStatus, setCronStatus] = useState({});
  const [activeTab,  setActiveTab]  = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res  = await apiFetch('/admin/stats', token);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLastRefresh(new Date());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const triggerCron = async (job) => {
    setCronStatus(s => ({ ...s, [job]: 'running' }));
    try {
      const res  = await apiFetch(`/admin/cron/${job}`, token, { method: 'POST' });
      const data = await res.json();
      setCronStatus(s => ({ ...s, [job]: data.success ? 'done' : 'error' }));
      if (data.success) loadStats();
    } catch {
      setCronStatus(s => ({ ...s, [job]: 'error' }));
    } finally {
      setTimeout(() => setCronStatus(s => ({ ...s, [job]: null })), 4000);
    }
  };

  const s = stats;
  const insightTotal = s?.insights?.total || 0;
  const hcPct  = insightTotal ? Math.round((s.insights.highConfidence / insightTotal) * 100) : 0;
  const bvPct  = insightTotal ? Math.round((s.insights.bestValue      / insightTotal) * 100) : 0;

  const TABS = [
    { key: 'overview',    label: 'Overview',    icon: '⊞' },
    { key: 'predictions', label: 'Predictions', icon: '📊' },
    { key: 'players',     label: 'Player IDs',  icon: '🆔' },
    { key: 'crons',       label: 'Jobs',        icon: '⚙' },
  ];

  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>
            Platform overview · {lastRefresh ? `Last updated ${timeAgo(lastRefresh)}` : 'Loading…'} · auto-refreshes every 60s
          </p>
        </div>
        <div className={styles.tabBar}>
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`${styles.tabBtn} ${activeTab === key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className={styles.tabIcon}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          {/* Stat grid */}
          <div className={styles.sectionLabel}>Platform Health</div>
          <div className={styles.statGrid}>
            <StatCard
              label="Total Users"
              value={fmt(s?.users?.total)}
              sub={`+${s?.users?.newToday ?? 0} today · +${s?.users?.newThisWeek ?? 0} this week`}
              tooltip="All registered accounts"
            />
            <StatCard
              label="Total Insights"
              value={fmt(insightTotal)}
              sub={`${s?.insights?.generatedToday ?? 0} today · ${s?.insights?.generatedThisWeek ?? 0} this week`}
              tooltip="AI-generated betting insights unlocked by users. Each costs 1 credit."
              accentColor="var(--color-info)"
            />
            <StatCard
              label="Credits Spent"
              value={fmt(s?.economy?.totalCreditsSpent)}
              sub="all time across all users"
              tooltip="Total credits deducted for insight unlocks. 1 credit = 1 insight."
              accentColor="var(--color-warning)"
            />
            <StatCard
              label="Revenue"
              value={`$${s?.economy?.totalRevenueUSD ?? '0.00'}`}
              sub="from Stripe purchases"
              tooltip="Total USD collected from credit pack purchases via Stripe."
              accentColor="var(--color-accent)"
            />
            <StatCard
              label="Live Props"
              value={fmt(s?.live?.availableProps)}
              sub="scored and ready to unlock"
              tooltip="Player prop cards visible to users right now. Requires Odds API quota."
              accentColor="var(--color-purple)"
            />
            <StatCard
              label="Games Today"
              value={fmt(s?.live?.scheduledGames)}
              sub="scheduled or in progress"
              tooltip="NBA games with upcoming or live status within the next 72 hours."
            />
            <StatCard
              label="HC Insights"
              value={`${fmt(s?.insights?.highConfidence)} (${hcPct}%)`}
              sub="high confidence tag"
              tooltip="Insights where the player hit the over/under in ≥ 4 of their last 5 games (80%+ hit rate)."
              accentColor="var(--color-accent)"
            />
            <StatCard
              label="BV Insights"
              value={`${fmt(s?.insights?.bestValue)} (${bvPct}%)`}
              sub="best value tag"
              tooltip="Insights where the 10-game average is ≥ 15% above or below the book's line. Indicates a meaningful edge."
              accentColor="var(--color-warning)"
            />
            <StatCard
              label="Avg Edge (30d)"
              value={s?.insights?.avgEdge30d != null ? `${s.insights.avgEdge30d}%` : '—'}
              sub="absolute avg edge across all insights"
              tooltip="Average absolute edge percentage on insights from the last 30 days. Higher = more divergence between our data and the book's line."
              accentColor="var(--color-info)"
            />
          </div>

          {/* Distribution charts */}
          {s && insightTotal > 0 && (
            <>
              <div className={styles.sectionLabel}>Insight Distributions</div>
              <div className={styles.distGrid}>
                <DistBar
                  label="AI Confidence"
                  tooltip="How the AI rated its own confidence for each insight. High = strong data signal. Medium = some uncertainty. Low = limited data."
                  values={s.insights.byConfidence}
                  total={insightTotal}
                  colorMap={{ high: 'var(--color-accent)', medium: 'var(--color-warning)', low: 'var(--color-danger)' }}
                />
                <DistBar
                  label="Data Quality"
                  tooltip="Quality of the underlying stat data. Strong = all 3 windows (5/10/30 games) had real data. Moderate = partial. Weak = missing data."
                  values={s.insights.byDataQuality}
                  total={insightTotal}
                  colorMap={{ strong: 'var(--color-accent)', moderate: 'var(--color-warning)', weak: 'var(--color-danger)' }}
                />
                <DistBar
                  label="Over vs Under Split"
                  tooltip="How many insights recommend OVER vs UNDER. A healthy split should be close to 50/50 — skewed splits may indicate data bias."
                  values={s.insights.byRecommendation}
                  total={insightTotal}
                  colorMap={{ over: 'var(--color-accent)', under: 'var(--color-info)' }}
                />
              </div>
            </>
          )}

          {!s && !loading && (
            <div className={styles.emptyState}>
              <p>Could not load stats. Check the server is running.</p>
              <button className={styles.retryBtn} onClick={loadStats}>Retry</button>
            </div>
          )}
        </div>
      )}

      {/* ── Predictions Tab ── */}
      {activeTab === 'predictions' && (
        <div className={styles.tabContent}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <h2 className={styles.panelTitle}>Recent Predictions</h2>
              <p className={styles.panelDesc}>
                The 20 most recently generated insights. Each row is one AI scouting report unlocked by a user.
                <strong> Edge %</strong> = how far the 10-game avg diverges from the book's line.
                <strong> HC</strong> = hit rate ≥ 80% (last 5 games).
                <strong> BV</strong> = edge ≥ 15%.
              </p>
            </div>
            <button className={styles.refreshBtn} onClick={loadStats} title="Refresh predictions">↻ Refresh</button>
          </div>

          <div className={styles.tableWrap}>
            <div className={`${styles.tableHead} ${styles.predTableHead}`}>
              <span>Player · Stat · Line</span>
              <span>Signal</span>
              <span title="(10-game avg − line) / line × 100">Edge %</span>
              <span>AI Conf</span>
              <span>Tags</span>
              <span>When</span>
            </div>
            {loading ? (
              <div className={styles.tableMsg}>Loading…</div>
            ) : (s?.recentInsights || []).length === 0 ? (
              <div className={styles.tableMsg}>No insights generated yet. Users need to unlock props first.</div>
            ) : (
              (s?.recentInsights || []).map(insight => (
                <PredictionRow key={insight._id} insight={insight} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Players Tab ── */}
      {activeTab === 'players' && <PlayerHealthPanel token={token} />}

      {/* ── Crons Tab ── */}
      {activeTab === 'crons' && (
        <div className={styles.tabContent}>
          <div className={styles.panelTitleGroup} style={{ marginBottom: '20px' }}>
            <h2 className={styles.panelTitle}>Background Jobs</h2>
            <p className={styles.panelDesc}>
              These jobs run automatically on a schedule. You can trigger them manually here for testing or to force a refresh.
              Each job is idempotent — safe to run multiple times.
            </p>
          </div>
          <div className={styles.cronGrid}>
            {CRON_JOBS.map(({ key, label, icon, desc, when }) => {
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
                      onClick={() => triggerCron(key)}
                      disabled={status === 'running'}
                    >
                      {status === 'running' ? '⟳ Running…'
                        : status === 'done'    ? '✓ Done'
                        : status === 'error'   ? '✗ Failed'
                        : '▶ Run Now'}
                    </button>
                  </div>
                  <p className={styles.cronDesc}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}