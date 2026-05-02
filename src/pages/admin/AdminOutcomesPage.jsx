// pages/admin/AdminOutcomesPage.jsx
// Full outcome audit — graded results, per-stat + per-sport performance
import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdmin';
import styles from '@/styles/AdminShared.module.scss';

const fmt      = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const pct      = (n) => n == null ? '—' : `${n}%`;
const titleize = (v) => v ? String(v).replace(/_/g, ' ') : '—';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function getConfidenceBand(c) {
  const n = Number(c);
  if (!isFinite(n)) return 'unknown';
  if (n >= 80) return '80-100';
  if (n >= 60) return '60-79';
  return '0-59';
}

// ── Performance summary card ──────────────────────────────────
function PerfCard({ label, wins, losses, pushes, sub, accent }) {
  const total  = wins + losses;
  const winPct = total ? Math.round((wins / total) * 100) : null;
  return (
    <div className={styles.perfCard}>
      <p className={styles.perfLabel}>{label}</p>
      <p className={styles.perfValue} style={accent ? { color: accent } : {}}>
        {winPct != null ? `${winPct}%` : '—'}
      </p>
      <p className={styles.perfSub}>{wins}W · {losses}L{pushes ? ` · ${pushes}P` : ''}</p>
      {sub && <p className={styles.perfNote}>{sub}</p>}
    </div>
  );
}

// ── Outcome row ───────────────────────────────────────────────
function OutcomeRow({ row }) {
  const [expanded, setExpanded] = useState(false);
  const isOver = row.rec === 'over';
  const resultStyle = {
    win:  { color: 'var(--color-accent)',   background: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.25)' },
    loss: { color: 'var(--color-danger)',   background: 'rgba(255,61,90,0.1)',  border: 'rgba(255,61,90,0.25)' },
    push: { color: 'var(--color-warning)',  background: 'rgba(255,171,0,0.1)',  border: 'rgba(255,171,0,0.25)' },
  }[row.result] || { color: 'var(--color-text-muted)', background: 'var(--color-bg-elevated)', border: 'var(--color-bg-border)' };

  return (
    <>
      <div className={styles.tableRow} onClick={() => setExpanded(v => !v)} style={{ cursor: 'pointer' }}>
        <div>
          <div className={styles.tdBold}>{row.playerName}</div>
          <div className={styles.tdMuted}>{(row.sport||'—').toUpperCase()} · {titleize(row.statType)}</div>
        </div>
        <span className={styles.tdMono}>{row.line ?? '—'}</span>
        <span style={{ color: isOver ? 'var(--color-accent)' : 'var(--color-danger)', fontWeight: 700, fontSize: '0.75rem' }}>
          {isOver ? '▲' : '▼'} {row.rec?.toUpperCase()}
        </span>
        <span className={styles.tdMono}>{row.actual != null ? fmt(row.actual, 1) : '—'}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '3px 8px', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: resultStyle.color, background: resultStyle.background,
          border: `1px solid ${resultStyle.border}`,
          width: 'fit-content',
        }}>
          {row.result || 'unresolved'}
        </span>
        <span className={styles.tdMono}>{row.confidence != null ? `${Math.round(row.confidence)}%` : '—'}</span>
        <span className={styles.tdMono} style={{ color: (row.edge||0) >= 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}>
          {row.edge != null ? `${row.edge >= 0 ? '+' : ''}${Number(row.edge).toFixed(1)}%` : '—'}
        </span>
        <span className={styles.tdMuted}>{row.createdAt ? timeAgo(row.createdAt) : '—'}</span>
      </div>
      {expanded && (
        <div className={styles.expandedRow}>
          {[
            ['Event ID', row.eventId],
            ['Game Status', row.gameStatus],
            ['Stat Type', titleize(row.statType)],
            ['Betting Line', row.line],
            ['Actual', row.actual != null ? fmt(row.actual, 1) : '—'],
            ['Confidence', row.confidence != null ? `${Number(row.confidence).toFixed(1)}%` : '—'],
            ['Edge %', row.edge != null ? `${row.edge >= 0 ? '+' : ''}${Number(row.edge).toFixed(2)}%` : '—'],
            ['Created', row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'],
          ].map(([label, val]) => (
            <div key={label} className={styles.expandedItem}>
              <span className={styles.expandedLabel}>{label}</span>
              <span className={styles.expandedValue}>{val ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminOutcomesPage() {
  const { stats: s, isLoading } = useAdminStats();
  const [sportFilter,      setSportFilter]      = useState('all');
  const [resultFilter,     setResultFilter]     = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [search,           setSearch]           = useState('');

  const outcomes = s?.outcomes;

  const filterRow = (row) => {
    const q = search.trim().toLowerCase();
    if (q && !`${row.playerName||''} ${row.statType||''} ${row.sport||''}`.toLowerCase().includes(q)) return false;
    if (sportFilter      !== 'all' && row.sport !== sportFilter) return false;
    if (confidenceFilter !== 'all' && getConfidenceBand(row.confidence) !== confidenceFilter) return false;
    return true;
  };

  const resolvedRows = (outcomes?.sampleResolved || [])
    .filter(r => filterRow(r) && (resultFilter === 'all' || r.result === resultFilter));
  const pendingRows  = [...(outcomes?.sampleUnresolved || []), ...(outcomes?.samplePending || [])]
    .filter(r => filterRow(r) && ['all', 'pending'].includes(resultFilter));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Outcome Audit</h1>
          <p className={styles.pageHint}>Graded predictions vs actual game results · win rate, edge accuracy, per-sport performance</p>
        </div>
      </div>

      {/* Summary performance cards */}
      <div className={styles.perfGrid}>
        <PerfCard
          label="Overall Win Rate"
          wins={outcomes?.wins||0} losses={outcomes?.losses||0} pushes={outcomes?.pushes||0}
          sub={`${outcomes?.graded||0} graded · ${outcomes?.unresolved||0} unresolved`}
          accent="var(--color-accent)"
        />
        <PerfCard
          label="NBA"
          wins={outcomes?.bySport?.nba?.wins||0}
          losses={outcomes?.bySport?.nba?.losses||0}
          pushes={outcomes?.bySport?.nba?.pushes||0}
          sub={`${outcomes?.bySport?.nba?.graded||0} graded`}
          accent="var(--color-warning)"
        />
        <PerfCard
          label="MLB"
          wins={outcomes?.bySport?.mlb?.wins||0}
          losses={outcomes?.bySport?.mlb?.losses||0}
          pushes={outcomes?.bySport?.mlb?.pushes||0}
          sub={`${outcomes?.bySport?.mlb?.graded||0} graded`}
          accent="var(--color-purple)"
        />
        <PerfCard
          label="NHL"
          wins={outcomes?.bySport?.nhl?.wins||0}
          losses={outcomes?.bySport?.nhl?.losses||0}
          pushes={outcomes?.bySport?.nhl?.pushes||0}
          sub={`${outcomes?.bySport?.nhl?.graded||0} graded`}
          accent="var(--color-info)"
        />
        <PerfCard
          label="High Confidence (80-100)"
          wins={outcomes?.byConfidence?.['80-100']?.wins||0}
          losses={outcomes?.byConfidence?.['80-100']?.losses||0}
          pushes={outcomes?.byConfidence?.['80-100']?.pushes||0}
          sub={`${outcomes?.byConfidence?.['80-100']?.graded||0} graded`}
          accent="var(--color-accent)"
        />
        <PerfCard
          label="Mid Confidence (60-79)"
          wins={outcomes?.byConfidence?.['60-79']?.wins||0}
          losses={outcomes?.byConfidence?.['60-79']?.losses||0}
          pushes={outcomes?.byConfidence?.['60-79']?.pushes||0}
          sub={`${outcomes?.byConfidence?.['60-79']?.graded||0} graded`}
          accent="var(--color-warning)"
        />
        <PerfCard
          label="Low Confidence (0-59)"
          wins={outcomes?.byConfidence?.['0-59']?.wins||0}
          losses={outcomes?.byConfidence?.['0-59']?.losses||0}
          pushes={outcomes?.byConfidence?.['0-59']?.pushes||0}
          sub={`${outcomes?.byConfidence?.['0-59']?.graded||0} graded`}
          accent="var(--color-danger)"
        />
        <div className={styles.perfCard}>
          <p className={styles.perfLabel}>Avg Edge — Wins</p>
          <p className={styles.perfValue} style={{ color: 'var(--color-accent)' }}>
            {outcomes?.avgEdgeOnWins != null ? `${outcomes.avgEdgeOnWins}%` : '—'}
          </p>
          <p className={styles.perfSub}>avg abs edge on correct calls</p>
          <p className={styles.perfNote} style={{ color: 'var(--color-danger)' }}>
            Losses: {outcomes?.avgEdgeOnLosses != null ? `${outcomes.avgEdgeOnLosses}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters + table */}
      <div className={styles.searchRow} style={{ marginBottom: '16px' }}>
        <input
          className={styles.searchInput}
          placeholder="Search player, stat, sport…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select className={styles.searchInput} value={sportFilter} onChange={e => setSportFilter(e.target.value)} style={{ minWidth: 'unset', width: 120 }}>
          <option value="all">All Sports</option>
          <option value="nba">NBA</option>
          <option value="mlb">MLB</option>
          <option value="nhl">NHL</option>
        </select>
        <select className={styles.searchInput} value={resultFilter} onChange={e => setResultFilter(e.target.value)} style={{ minWidth: 'unset', width: 130 }}>
          <option value="all">All Results</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
          <option value="push">Push</option>
          <option value="pending">Pending</option>
        </select>
        <select className={styles.searchInput} value={confidenceFilter} onChange={e => setConfidenceFilter(e.target.value)} style={{ minWidth: 'unset', width: 130 }}>
          <option value="all">All Confidence</option>
          <option value="80-100">80–100</option>
          <option value="60-79">60–79</option>
          <option value="0-59">0–59</option>
        </select>
      </div>

      {/* Resolved rows */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Player · Sport · Stat</th>
              <th>Line</th>
              <th>Pick</th>
              <th>Actual</th>
              <th>Result</th>
              <th>Conf</th>
              <th>Edge %</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className={styles.loading}>Loading…</td></tr>
            ) : resolvedRows.length === 0 ? (
              <tr><td colSpan={8} className={styles.loading}>
                {!(outcomes?.sampleResolved?.length) ? 'No resolved outcomes yet.' : 'No rows match the current filters.'}
              </td></tr>
            ) : resolvedRows.map(row => (
              <OutcomeRow key={`${row.eventId}_${row.playerName}_${row.statType}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending/unresolved */}
      {pendingRows.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', margin: '24px 0 10px' }}>
            Pending / Unresolved ({pendingRows.length})
          </h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Player · Sport · Stat</th>
                  <th>Line</th>
                  <th>Pick</th>
                  <th>Actual</th>
                  <th>Status</th>
                  <th>Conf</th>
                  <th>Edge %</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map(row => (
                  <tr key={`${row.eventId}_${row.playerName}_${row.statType}_p`} className={styles.tableRow}>
                    <td><div className={styles.tdBold}>{row.playerName}</div><div className={styles.tdMuted}>{(row.sport||'—').toUpperCase()} · {titleize(row.statType)}</div></td>
                    <td className={styles.tdMono}>{row.line ?? '—'}</td>
                    <td style={{ color: row.rec==='over' ? 'var(--color-accent)' : 'var(--color-danger)', fontWeight: 700, fontSize: '0.75rem' }}>
                      {row.rec === 'over' ? '▲' : '▼'} {row.rec?.toUpperCase()}
                    </td>
                    <td className={styles.tdMono}>—</td>
                    <td><span className={styles.tdMuted}>pending</span></td>
                    <td className={styles.tdMono}>{row.confidence != null ? `${Math.round(row.confidence)}%` : '—'}</td>
                    <td className={styles.tdMono}>{row.edge != null ? `${row.edge >= 0 ? '+' : ''}${Number(row.edge).toFixed(1)}%` : '—'}</td>
                    <td className={styles.tdMuted}>{row.createdAt ? timeAgo(row.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}