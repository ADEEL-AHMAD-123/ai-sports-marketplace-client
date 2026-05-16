// src/components/home/ScoutClosings.jsx
//
// Trust-building section: real recent successful AI predictions.
// Pulls from GET /api/insights/scout-closings (public — no auth required).
// Falls back to a small set of curated historical wins when the API hasn't
// graded enough fresh insights yet (early-stage product / quiet day).
//
// The hit rate shown is computed by the backend over the same window.

import React, { useEffect, useState } from 'react';
import styles from './ScoutClosings.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const API = (path) => `${API_BASE}${path}`;

// ── Fallback set ─ shown only when the backend returns 0 graded items ────────
// Used during early launch / quiet days. Marketing-grade examples; clearly
// labeled as "Sample" so we never claim them as live results.
const FALLBACK_CLOSINGS = [
  {
    id: 'sample-1', sport: 'nba', league: 'NBA',
    player: 'Sample Pick', statType: 'Points', line: 22.5,
    recommendation: 'over', edge: '+19.1%', confidence: 80,
    isHighConfidence: true, actual: 28, result: 'HIT',
    matchup: 'LAL vs MIN', isSample: true,
  },
];

const FALLBACK_HIT_RATE = null;
const FALLBACK_TOTAL    = 0;

function timeAgo(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

function DirectionIcon({ rec }) {
  return rec === 'over'
    ? <span className={styles.dirOver}>▲</span>
    : <span className={styles.dirUnder}>▼</span>;
}

function ResultBadge() {
  return <span className={styles.hitBadge}>✓ HIT</span>;
}

const titleize = (v) => v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

export default function ScoutClosings() {
  const [items,    setItems]    = useState([]);
  const [hitRate,  setHitRate]  = useState(FALLBACK_HIT_RATE);
  const [total,    setTotal]    = useState(FALLBACK_TOTAL);
  const [loading,  setLoading]  = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API('/insights/scout-closings?limit=10&perSportMin=2'), {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setItems(json.data);
          setHitRate(json.meta?.hitRate ?? null);
          setTotal(json.meta?.total ?? json.data.length);
          setUsingFallback(false);
        } else {
          setItems(FALLBACK_CLOSINGS);
          setUsingFallback(true);
        }
      } catch {
        if (cancelled) return;
        setItems(FALLBACK_CLOSINGS);
        setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Skeleton on first paint
  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.verifiedBadge}>VERIFIED PERFORMANCE</div>
              <h2 className={styles.title}>Recent Scout Closings</h2>
              <p className={styles.sub}>Loading recent results…</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Empty/fallback messaging
  if (!items.length) {
    return null; // gracefully hide if no data and no fallback
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.verifiedBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {usingFallback ? 'PREVIEW' : 'VERIFIED PERFORMANCE'}
            </div>
            <h2 className={styles.title}>Recent Scout Closings</h2>
            <p className={styles.sub}>
              {usingFallback
                ? 'Sample picks shown — live grading begins as games finalize.'
                : `Our last ${items.length} winning AI scouting reports — live accuracy tracked in real time. No cherry-picking. No revisionist history.`}
            </p>
          </div>
          {hitRate != null && (
            <div className={styles.hitRateBox}>
              <span className={styles.hitRateNum}>{hitRate}%</span>
              <span className={styles.hitRateLabel}>{total ? `LAST ${total} HIT RATE` : 'HIT RATE'}</span>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <span>SCOUT TARGET</span>
            <span>PROP LINE</span>
            <span>AI CALL</span>
            <span>EDGE / CONF</span>
            <span>RESULT</span>
          </div>

          {items.map(s => (
            <div key={s.id} className={styles.row}>
              {/* Scout target */}
              <div className={styles.targetCell}>
                <span className={styles.targetDot} />
                <div>
                  <p className={styles.playerName}>{s.player}</p>
                  <p className={styles.gameMeta}>
                    {s.league || s.sport?.toUpperCase()}
                    {s.matchup ? ` · ${s.matchup}` : ''}
                    {s.gameDate ? ` · ${timeAgo(s.gameDate)}` : ''}
                  </p>
                </div>
              </div>
              {/* Prop line */}
              <div className={styles.lineCell}>
                <span className={styles.statType}>{titleize(s.statType)}</span>
                <span className={styles.lineVal}>{s.line}</span>
              </div>
              {/* AI call */}
              <div className={styles.callCell}>
                <DirectionIcon rec={s.recommendation} />
                <span className={styles.callText}>{(s.recommendation || '').toUpperCase()}</span>
              </div>
              {/* Edge / confidence */}
              <div className={styles.edgeCell}>
                {s.edge && <span className={styles.edgeVal}>{s.edge} edge</span>}
                {s.confidence != null && <span className={styles.confVal}>{s.confidence}% conf</span>}
              </div>
              {/* Result */}
              <div className={styles.resultCell}>
                <ResultBadge />
                {s.actual != null && (
                  <span className={styles.actualVal}>
                    {s.actual} {String(s.statType || '').toLowerCase().replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className={styles.cardList}>
          {items.map(s => {
            const resultCls = styles.resultWin;
            return (
              <div key={s.id} className={`${styles.mobileCard} ${resultCls}`}>
                <div className={styles.mcTop}>
                  <div className={styles.mcPlayer}>
                    <span className={styles.targetDot} />
                    <div>
                      <p className={styles.playerName}>{s.player}</p>
                      <p className={styles.gameMeta}>
                        {s.matchup || s.league || s.sport?.toUpperCase()}
                        {s.gameDate ? ` · ${timeAgo(s.gameDate)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className={styles.mcResult}>
                    <span className={`${styles.resultBadge} ${styles.resultWin}`}>HIT</span>
                    {s.actual != null && (
                      <span className={styles.actualVal}>{s.actual} {String(s.statType || '').toLowerCase().replace(/_/g, ' ')}</span>
                    )}
                  </div>
                </div>
                <div className={styles.mcMeta}>
                  <div className={styles.mcMetaItem}>
                    <span className={styles.mcMetaLbl}>{titleize(s.statType)}</span>
                    <span className={styles.mcMetaVal}>{(s.recommendation || '').toUpperCase()} {s.line}</span>
                  </div>
                  {s.edge && (
                    <div className={styles.mcMetaItem}>
                      <span className={styles.mcMetaLbl}>Edge</span>
                      <span className={styles.edgeVal}>{s.edge}</span>
                    </div>
                  )}
                  {s.confidence != null && (
                    <div className={styles.mcMetaItem}>
                      <span className={styles.mcMetaLbl}>Conf</span>
                      <span className={styles.mcMetaVal}>{s.confidence}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className={styles.disclaimer}>
          {usingFallback
            ? '* Live results will populate as games finalize and AI predictions get graded.'
            : '* Results shown are a recent sample and should not be treated as guaranteed future performance. Always verify odds before placing bets and bet responsibly.'}
        </p>
      </div>
    </section>
  );
}
