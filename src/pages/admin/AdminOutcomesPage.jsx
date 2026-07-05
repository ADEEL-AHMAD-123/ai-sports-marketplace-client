// pages/admin/AdminOutcomesPage.jsx
//
// Per-sport, per-game accuracy dashboard — premium designer pass.
//
// Information hierarchy (top → bottom):
//   1. Title + actions
//   2. Inline "How it works" (collapsed by default)
//   3. Lifetime KPI: one prominent overall card + 5 sport tiles
//   4. Filter row: sport × time window
//   5. Per-game list. Each game shows matchup + win-rate pill + record;
//      click to drill into the full insight roster.
//
// What we deliberately DO NOT show:
//   • Raw eventId (technical noise; uses "Game pending data" if no teams)
//   • Avg confidence column (low signal; available in expanded detail)
//   • Insights count column (W+L+P sums to it — redundant)
//   • Fully spelled timestamps (use timeAgo + short date)

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/slices/authSlice';
import { useAdminStats } from '@/hooks/useAdmin';
import s from './AdminOutcomesPage.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const API = (p) => `${API_BASE}${p}`;

const SPORTS = ['nba', 'mlb', 'nhl', 'nfl', 'soccer'];
const SPORT_LABEL = { nba: 'NBA', mlb: 'MLB', nhl: 'NHL', nfl: 'NFL', soccer: 'Soccer' };

const titleize = (v) => v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
const fmt      = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });

function timeAgo(iso) {
  if (!iso) return '—';
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

function shortGameTime(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const games = new Date(d);
    games.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((games - today) / 86400000);
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (dayDiff === 0)      return `Today ${time}`;
    if (dayDiff === -1)     return `Yesterday ${time}`;
    if (dayDiff === 1)      return `Tomorrow ${time}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + time;
  } catch { return null; }
}

// ── Sport pill — small visual identifier, used in row + insight detail ──
function SportPill({ sport }) {
  return <span className={`${s.sportPill} ${s[`sportPill_${sport}`] || ''}`}>{SPORT_LABEL[sport] || (sport || '').toUpperCase()}</span>;
}

// ── Result pill — for individual insight rows ──────────────────────────
function ResultPill({ result }) {
  const cls = {
    win:   s.resultWin,
    loss:  s.resultLoss,
    push:  s.resultPush,
  }[result] || s.resultPending;
  const label = {
    win:  '✓ HIT', loss: '✗ MISS', push: 'PUSH',
  }[result] || 'pending';
  return <span className={`${s.resultPill} ${cls}`}>{label}</span>;
}

// ── Win-rate pill — focal element for each game row ────────────────────
function WinRatePill({ rate, size = 'md' }) {
  if (rate == null) return <span className={s.winRateMuted}>—</span>;
  const cls = rate >= 60 ? s.winRateGood : rate >= 40 ? s.winRateMid : s.winRateBad;
  return <span className={`${s.winRatePill} ${s[`winRate_${size}`]} ${cls}`}>{rate}%</span>;
}

// ── Record bar — visual W/L/P stack used in the row ────────────────────
function RecordBar({ wins, losses, pushes }) {
  const total = wins + losses + (pushes || 0);
  if (!total) return <span className={s.recordEmpty}>No graded picks</span>;
  return (
    <span className={s.record}>
      <span className={s.recordWins}>{wins}<span className={s.recordLetter}>W</span></span>
      <span className={s.recordSep}>·</span>
      <span className={s.recordLosses}>{losses}<span className={s.recordLetter}>L</span></span>
      {pushes > 0 && (
        <>
          <span className={s.recordSep}>·</span>
          <span className={s.recordPushes}>{pushes}<span className={s.recordLetter}>P</span></span>
        </>
      )}
    </span>
  );
}

// ── KPI tile (lifetime per sport) ──────────────────────────────────────
function KpiTile({ label, value, sub, accent }) {
  return (
    <div className={`${s.kpiTile} ${accent ? s.kpiTileAccent : ''}`}>
      <span className={s.kpiTileLabel}>{label}</span>
      <span className={s.kpiTileValue}>{value}</span>
      {sub && <span className={s.kpiTileSub}>{sub}</span>}
    </div>
  );
}

// ── Lifetime "hero" KPI card ───────────────────────────────────────────
function HeroKpi({ winRate, wins, losses, pushes, graded }) {
  return (
    <div className={s.heroKpi}>
      <div className={s.heroKpiHeader}>
        <span className={s.kpiTileLabel}>Lifetime Hit Rate</span>
        <span className={s.heroKpiBadge}>verified</span>
      </div>
      <span className={s.heroKpiNum}>
        {winRate != null ? `${winRate}%` : '—'}
      </span>
      <div className={s.heroKpiSub}>
        {graded > 0 ? (
          <>
            <strong className={s.heroKpiWins}>{wins} W</strong>
            <span className={s.heroKpiDot}>·</span>
            <strong className={s.heroKpiLosses}>{losses} L</strong>
            {pushes > 0 && (
              <>
                <span className={s.heroKpiDot}>·</span>
                <strong className={s.heroKpiPushes}>{pushes} P</strong>
              </>
            )}
            <span className={s.heroKpiTotal}>{graded} graded</span>
          </>
        ) : (
          <span className={s.heroKpiEmpty}>No outcomes graded yet</span>
        )}
      </div>
    </div>
  );
}

// ── How-it-works — collapsed by default ───────────────────────────────
function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${s.howItWorks} ${open ? s.howOpen : ''}`}>
      <button className={s.howHeader} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className={s.howIcon}>?</span>
        <span>How performance tracking works</span>
        <span className={`${s.howCaret} ${open ? s.howCaretOpen : ''}`}>▾</span>
      </button>
      {open && (
        <div className={s.howSteps}>
          {[
            ['1', 'Insight unlocked',     'When a user spends a credit, the AI generates a real prediction tied to a specific game, player, line, and direction.'],
            ['2', 'Game finalizes',       'Every 15 minutes the post-game cron flips finished games to FINAL and triggers grading via official sport APIs.'],
            ['3', 'Outcome calculated',   'We pull the actual stat from the game log and compare to the AI pick. Result is stored as win / loss / push on the insight.'],
            ['4', 'Public hit-rate updates', 'ScoutClosings on the homepage reads from this data via the public endpoint with a 5-minute cache.'],
            ['5', 'Daily archive (3am)',  'Graded insights older than 90 days are aggregated into per-sport lifetime totals, then deleted to keep the DB lean.'],
          ].map(([num, title, body]) => (
            <div key={num} className={s.howStep}>
              <span className={s.howStepNum}>STEP {num}</span>
              <span className={s.howStepTitle}>{title}</span>
              <span className={s.howStepBody}>{body}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminOutcomesPage() {
  const token = useSelector(selectToken);
  const { stats: a } = useAdminStats();
  const liveSummary = a?.outcomes;

  const [archive, setArchive]  = useState({});
  const [sport, setSport]      = useState('all');
  const [days, setDays]        = useState(30);
  const [page, setPage]        = useState(1);
  const LIMIT = 20;

  const [report, setReport]    = useState(null);
  const [loading, setLoading]  = useState(true);

  const [openId, setOpenId]            = useState(null);
  const [detailMap, setDetailMap]      = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport, days: String(days), page: String(page), limit: String(LIMIT),
      });
      const res  = await fetch(API(`/admin/performance/games?${params}`), { headers: authHeaders });
      const json = await res.json();
      if (json?.success) setReport(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, days, page, token]);

  useEffect(() => { loadReport(); }, [loadReport]);

  // Lifetime archive snapshot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(API('/admin/performance/archive'), { headers: authHeaders });
        const json = await res.json();
        if (!cancelled && json?.success) setArchive(json.archive || {});
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleRow = async (eventId) => {
    if (openId === eventId) { setOpenId(null); return; }
    setOpenId(eventId);
    if (detailMap[eventId]) return;
    setDetailLoading(true);
    try {
      const res  = await fetch(API(`/admin/performance/games/${eventId}`), { headers: authHeaders });
      const json = await res.json();
      if (json?.success) setDetailMap(prev => ({ ...prev, [eventId]: json }));
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const onPruneExhausted = async () => {
    if (!confirm('Prune ungraded retry-exhausted insights older than 14 days?')) return;
    try {
      const res = await fetch(API('/admin/performance/prune-exhausted'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ days: 14 }),
      });
      const json = await res.json();
      alert(json?.success ? `Pruned ${json.deleted} stale insights.` : 'Prune failed.');
      loadReport();
    } catch { alert('Prune failed.'); }
  };

  const onArchiveGraded = async () => {
    if (!confirm('Archive graded insights older than 90 days into lifetime totals, then delete originals? This is what the daily cron runs.')) return;
    try {
      const res = await fetch(API('/admin/performance/archive-graded'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ days: 90 }),
      });
      const json = await res.json();
      alert(json?.success
        ? `Archived ${json.archived} insights and deleted ${json.deleted} originals.`
        : 'Archive failed.'
      );
      loadReport();
    } catch { alert('Archive failed.'); }
  };

  // Lifetime computation per sport (live + archive)
  const lifetimeFor = (sportKey) => {
    const arch = archive[sportKey] || {};
    const live = liveSummary?.bySport?.[sportKey] || {};
    const wins   = (arch.wins   || 0) + (live.wins   || 0);
    const losses = (arch.losses || 0) + (live.losses || 0);
    const pushes = (arch.pushes || 0) + (live.pushes || 0);
    const decisive = wins + losses;
    return {
      wins, losses, pushes,
      graded: wins + losses + pushes,
      winRate: decisive ? Math.round((wins * 100) / decisive) : null,
    };
  };

  // Overall lifetime accuracy — sums ONLY sports that actually have graded
  // outcomes. A sport that has never had a game (graded === 0) contributes
  // nothing to either wins/losses OR the sport-count, so it can never drag
  // the overall percentage up or down. Numerically equivalent to summing
  // over every sport, but the explicit filter documents the rule the user
  // asked for: "sports with no games shouldn't affect overall accuracy."
  const overall = (() => {
    const contributing = SPORTS
      .map(sp => lifetimeFor(sp))
      .filter(t => t.graded > 0);
    const wins   = contributing.reduce((s, t) => s + t.wins,   0);
    const losses = contributing.reduce((s, t) => s + t.losses, 0);
    const pushes = contributing.reduce((s, t) => s + t.pushes, 0);
    const decisive = wins + losses;
    return {
      wins, losses, pushes,
      graded: wins + losses + pushes,
      sportsWithData: contributing.length,
      winRate: decisive ? Math.round((wins * 100) / decisive) : null,
    };
  })();

  const totals = report?.summary || {};
  const rows   = report?.rows    || [];
  const pages  = report?.pagination?.pages || 1;

  // Friendly matchup label — never shows raw eventId
  const labelMatchup = (row) => {
    if (row.awayAbbr && row.homeAbbr) return `${row.awayAbbr} @ ${row.homeAbbr}`;
    if (row.awayTeam && row.homeTeam) return `${row.awayTeam} @ ${row.homeTeam}`;
    return 'Game pending data';
  };
  const labelTeams = (row) => {
    if (row.awayTeam && row.homeTeam) return `${row.awayTeam} vs ${row.homeTeam}`;
    return null;
  };

  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerMain}>
          <span className={s.eyebrow}>Performance Audit</span>
          <h1 className={s.title}>Per-Game Accuracy</h1>
          <p className={s.subtitle}>
            Real graded predictions vs. actual game results. Click any game to drill into every insight, line, AI call, and result.
          </p>
        </div>
        <div className={s.headerActions}>
          <button className={s.headerBtn} onClick={loadReport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
          <button className={s.headerBtn} onClick={onPruneExhausted} title="Delete ungraded retry-exhausted insights >14d">
            Prune retries
          </button>
          <button className={`${s.headerBtn} ${s.headerBtnDanger}`} onClick={onArchiveGraded} title="Archive graded insights >90d into lifetime totals">
            Archive 90d+
          </button>
        </div>
      </header>

      {/* How-it-works (collapsed) */}
      <HowItWorks />

      {/* Lifetime KPI — one big hero, then sport tiles */}
      <section className={s.kpiSection}>
        <HeroKpi
          winRate={overall.winRate}
          wins={overall.wins} losses={overall.losses} pushes={overall.pushes}
          graded={overall.graded}
        />
        <div className={s.kpiRow}>
          {SPORTS.map(sp => {
            const t = lifetimeFor(sp);
            return (
              <KpiTile
                key={sp}
                label={SPORT_LABEL[sp]}
                value={t.winRate != null ? `${t.winRate}%` : '—'}
                sub={t.graded ? `${t.wins}W · ${t.losses}L${t.pushes ? ` · ${t.pushes}P` : ''}` : 'no data'}
              />
            );
          })}
        </div>
      </section>

      {/* Filter row */}
      <div className={s.filterRow}>
        <div className={s.filterControls}>
          <select className={s.filter} value={sport} onChange={e => { setSport(e.target.value); setPage(1); }}>
            <option value="all">All Sports</option>
            {SPORTS.map(sp => <option key={sp} value={sp}>{SPORT_LABEL[sp]}</option>)}
          </select>
          <select className={s.filter} value={days} onChange={e => { setDays(parseInt(e.target.value, 10)); setPage(1); }}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        {totals.gamesShown != null && totals.gamesShown > 0 && (
          <span className={s.filterMeta}>
            {totals.gamesShown} games
            {totals.winRate != null && (
              <>
                <span className={s.filterMetaSep}>·</span>
                <strong className={s.filterMetaRate}>{totals.winRate}%</strong>
                <span className={s.filterMetaCounts}>
                  {totals.wins || 0}W {totals.losses || 0}L{totals.pushes ? ` ${totals.pushes}P` : ''}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Game list */}
      {loading ? (
        <div className={s.empty}>Loading per-game accuracy…</div>
      ) : rows.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>No graded games in this window</p>
          <p className={s.emptySub}>Once games finalize, their predictions will appear here automatically.</p>
        </div>
      ) : (
        <ul className={s.gameList}>
          {rows.map(row => {
            const isOpen   = openId === row.eventId;
            const detail   = detailMap[row.eventId];
            const teamsLine = labelTeams(row);
            return (
              <li key={row.eventId} className={`${s.gameItem} ${isOpen ? s.gameItemOpen : ''}`}>
                <button
                  className={s.gameRow}
                  onClick={() => toggleRow(row.eventId)}
                  aria-expanded={isOpen}
                >
                  <div className={s.gameMain}>
                    <div className={s.gameTopLine}>
                      <SportPill sport={row.sport} />
                      <span className={s.gameTime}>{shortGameTime(row.startTime) || timeAgo(row.lastGradedAt)}</span>
                    </div>
                    <div className={s.gameMatchup}>{labelMatchup(row)}</div>
                    {teamsLine && <div className={s.gameTeams}>{teamsLine}</div>}
                  </div>

                  <div className={s.gameStats}>
                    <RecordBar wins={row.wins} losses={row.losses} pushes={row.pushes || 0} />
                    <WinRatePill rate={row.winRate} size="lg" />
                  </div>

                  <span className={`${s.gameCaret} ${isOpen ? s.gameCaretOpen : ''}`}>▾</span>
                </button>

                {isOpen && (
                  <div className={s.detail}>
                    {detailLoading && !detail ? (
                      <p className={s.detailEmpty}>Loading insights…</p>
                    ) : !detail ? (
                      <p className={s.detailEmpty}>No detail available.</p>
                    ) : detail.insights.length === 0 ? (
                      <p className={s.detailEmpty}>No insights for this game yet.</p>
                    ) : (
                      <ul className={s.insightList}>
                        {detail.insights.map(i => (
                          <li key={i.id} className={s.insightRow}>
                            <div className={s.insightLeft}>
                              <span className={s.insightPlayer}>{i.playerName}</span>
                              <span className={s.insightStat}>{titleize(i.statType)} · {i.recommendation === 'over' ? 'O' : 'U'} {i.line}</span>
                              {(i.confidence != null || i.edge != null) && (
                                <span className={s.insightMicro}>
                                  {i.confidence != null && <>{Math.round(i.confidence)}% conf</>}
                                  {i.confidence != null && i.edge != null && <span className={s.insightMicroSep}>·</span>}
                                  {i.edge != null && (
                                    <span className={(i.edge || 0) >= 0 ? s.edgePos : s.edgeNeg}>
                                      {i.edge >= 0 ? '+' : ''}{Number(i.edge).toFixed(1)}% edge
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className={s.insightRight}>
                              <span className={s.insightActual}>
                                {i.actual != null ? fmt(i.actual, 1) : '—'}
                                <span className={s.insightActualLabel}>actual</span>
                              </span>
                              <ResultPill result={i.result} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className={s.pagination}>
          <button className={s.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className={s.pageInfo}>Page {page} of {pages}</span>
          <button className={s.pageBtn} onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
        </div>
      )}
    </div>
  );
}
