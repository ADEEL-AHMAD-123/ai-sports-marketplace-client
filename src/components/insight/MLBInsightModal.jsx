// src/components/insight/MLBInsightModal.jsx
//
// MLB-specific scouting report modal — hand-designed layout.
// Separate from the generic InsightModal because MLB has enough
// sport-specific signal (opposing starter, platoon splits, ballpark
// factor) that jamming it into the multi-sport template made the layout
// crowded and generic. Everything here is tuned for a single answer
// per view: should I bet this OVER/UNDER, and why.
//
// Data source: `insight` document from Mongo (leagueContext + flat
// stat fields saved by InsightService.create). Falls back gracefully
// when older records are missing new fields (parkFactor, matchupAvg…).

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatLabel } from '@/config/sportConfig';
import styles from './MLBInsightModal.module.scss';

// ── text polish ────────────────────────────────────────────────
const polishText = (raw) => {
  if (raw == null) return '';
  let s = String(raw).trim().replace(/\s+/g, ' ');
  if (!s) return '';
  const idx = s.search(/[A-Za-z]/);
  if (idx >= 0) s = s.slice(0, idx) + s[idx].toUpperCase() + s.slice(idx + 1);
  if (!/[.!?]$/.test(s)) s += '.';
  return s;
};

const polishList = (arr) => (arr || []).map(polishText).filter((s) => s.length > 0);

const formatInjuryStatus = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  if (v === 'day-to-day') return 'Day-to-Day';
  return v.charAt(0).toUpperCase() + v.slice(1);
};

// Batting average formatter: 0.230 → ".230"
const fmtAvg = (v) => {
  if (v == null || Number.isNaN(Number(v))) return null;
  return Number(v).toFixed(3).replace(/^0/, '');
};

// Smart date+time formatter for the header. Returns Today / Tomorrow /
// day-of-week + short date, and time in ET. Split so the modal can render
// them on separate lines for scannability.
const fmtGameDateTime = (iso) => {
  if (!iso) return { dateLabel: null, timeLabel: null };
  try {
    const d       = new Date(iso);
    const now     = new Date();
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gameDay = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
    const dayDiff = Math.round((gameDay - today) / 86400000);
    const dateLabel =
      dayDiff ===  0 ? 'Today' :
      dayDiff ===  1 ? 'Tomorrow' :
      dayDiff === -1 ? 'Yesterday' :
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeLabel = d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }) + ' ET';
    return { dateLabel, timeLabel };
  } catch { return { dateLabel: null, timeLabel: null }; }
};

// ── Recommendation: hero pill ─────────────────────────────────
// The whole point of this component is to answer, unmistakably:
// "What is the AI telling me to do?" — so it leads with an explicit
// "AI recommends" eyebrow, then an action verb ("Take OVER"), then
// the line as supporting detail. No abstract "OVER at 0.5" wording.
function Verdict({ recommendation, line }) {
  const isOver = recommendation === 'over';
  const label  = isOver ? 'OVER' : 'UNDER';
  return (
    <motion.div
      className={`${styles.verdict} ${isOver ? styles.verdictOver : styles.verdictUnder}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.verdictEyebrow}>AI recommends</div>
      <div className={styles.verdictBody}>
        <div className={styles.verdictIcon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isOver ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
          </svg>
        </div>
        <div className={styles.verdictText}>
          <div className={styles.verdictLabel}>Take {label}</div>
          <div className={styles.verdictSub}>Line: <strong>{line}</strong></div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Confidence semi-circle gauge ─────────────────────────────
function ConfidenceGauge({ value }) {
  const pct = Math.min(100, Math.max(0, Math.round(value ?? 0)));
  // Semicircle 180° from (6,42) to (66,42), radius 30
  const r = 30, cx = 36, cy = 42, len = Math.PI * r; // ≈ 94.25
  const dash = (pct / 100) * len;
  const tone = pct >= 70 ? 'high' : pct >= 50 ? 'mid' : 'low';

  return (
    <div className={`${styles.gauge} ${styles[`gauge_${tone}`]}`}>
      <svg width="72" height="46" viewBox="0 0 72 46" aria-hidden="true">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none" stroke="var(--gauge-track)" strokeWidth="5" strokeLinecap="round" />
        <motion.path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${len} ${len}`}
              initial={{ strokeDashoffset: len }}
              animate={{ strokeDashoffset: len - dash }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div className={styles.gaugeVal}>{pct}<span>%</span></div>
      <div className={styles.gaugeLbl}>Signal</div>
    </div>
  );
}

// ── Projection vs Line horizontal bar ─────────────────────────
// Visualizes how far the model's projection sits above/below the
// sportsbook line. Track scale is derived from data, not fixed —
// so a 0.1 gap on a 1.5 line and a 1.0 gap on a 5.5 line both
// read correctly.
function ProjectionBar({ line, projection, statLabel, recommendation }) {
  if (line == null || projection == null) return null;
  const isOver = recommendation === 'over';

  // Scale: 0 → max( line*1.6, projection*1.2 ), so both markers land
  // comfortably inside the track without one hugging the edge.
  const maxScale = Math.max(line * 1.6, projection * 1.2, 1);
  const linePct  = Math.min(100, Math.max(0, (line       / maxScale) * 100));
  const projPct  = Math.min(100, Math.max(0, (projection / maxScale) * 100));

  // Fill covers the region between line and projection (or 0→projection
  // if projection is BELOW the line — we still fill toward it so the
  // "gap" is always visible).
  const fillLeft  = Math.min(linePct, projPct);
  const fillWidth = Math.abs(projPct - linePct);

  return (
    <div className={styles.projBar}>
      <div className={styles.projHeader}>
        <span className={styles.eyebrow}>Projection vs line</span>
        <span className={styles.projSub}>{statLabel} per game</span>
      </div>
      <div className={styles.projTrack}>
        <div className={styles.projTrackBase} />
        <motion.div
          className={`${styles.projFill} ${isOver ? styles.projFillOver : styles.projFillUnder}`}
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        />
        <div className={styles.projMarker} style={{ left: `${linePct}%` }}>
          <div className={`${styles.projMarkerLine} ${styles.projMarkerLineNeutral}`} />
          <div className={`${styles.projMarkerLabel} ${styles.projMarkerLabelTop}`}>
            Line <strong>{line}</strong>
          </div>
        </div>
        <div className={styles.projMarker} style={{ left: `${projPct}%` }}>
          <div className={`${styles.projMarkerLine} ${isOver ? styles.projMarkerLineOver : styles.projMarkerLineUnder}`} />
          <div className={`${styles.projMarkerLabel} ${styles.projMarkerLabelBottom} ${isOver ? styles.projLabelOver : styles.projLabelUnder}`}>
            <strong>{projection}</strong> projected
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recent form sparkline ─────────────────────────────────────
// A tiny bar chart of the last N game results with the line drawn
// across. Bars are colored by whether they beat the line (over-rec)
// or missed it (under-rec). Answers "how often does this happen?"
// at a glance.
function RecentFormChart({ values, line, statLabel, recommendation }) {
  if (!Array.isArray(values) || values.length === 0 || line == null) return null;
  const isOver = recommendation === 'over';

  // Scale so the tallest bar reaches ~90% of the container.
  const max = Math.max(...values, line * 1.1, 1);
  const beat = values.filter((v) => v >= line).length;
  const missed = values.length - beat;
  const linePctFromBottom = Math.min(96, Math.max(4, (line / max) * 100));

  // For over recs, "beat line" = green; for under recs, "missed line" = green.
  const goodClass = isOver ? styles.sparkBarBeat : styles.sparkBarMiss;
  const badClass  = isOver ? styles.sparkBarMiss : styles.sparkBarBeat;
  const goodCount = isOver ? beat : missed;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <div className={styles.spark}>
      <div className={styles.sparkHeader}>
        <span className={styles.eyebrow}>Last {values.length} {statLabel.toLowerCase()}</span>
        <span className={styles.sparkSub}>
          <strong className={styles.sparkSubStrong}>{goodCount}</strong>
          {' '}on target
          <span className={styles.sep}>·</span>
          avg <strong>{Number.isFinite(avg) ? +avg.toFixed(2) : '—'}</strong>
        </span>
      </div>
      <div className={styles.sparkChart}>
        <div className={styles.sparkLine} style={{ bottom: `${linePctFromBottom}%` }} aria-hidden="true">
          <span className={styles.sparkLineLabel}>Line {line}</span>
        </div>
        <div className={styles.sparkBars}>
          {values.map((v, i) => {
            const h = Math.max(2, (v / max) * 100);
            const isGood = v >= line;
            return (
              <motion.div
                key={i}
                className={`${styles.sparkBar} ${isGood ? goodClass : badClass}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${h}%`, opacity: 1 }}
                transition={{ delay: 0.45 + i * 0.03, duration: 0.35, ease: 'easeOut' }}
                title={`Game ${i + 1}: ${v}`}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.sparkAxis}>
        {values.map((v, i) => (
          <span key={i} className={`${styles.sparkAxisLbl} ${v >= line ? styles.sparkAxisLblGood : ''}`}>{v}</span>
        ))}
      </div>
    </div>
  );
}

// ── Matchup panel: starter + platoon + park ──────────────────
// Single unified block — no colored left rails, no competing cards.
// Reads top-to-bottom as a scouting brief.
function MatchupPanel({ insight }) {
  const ctx     = insight?.leagueContext || {};
  const starter = ctx.starter || null;
  const platoon = ctx.platoon || null;
  const park    = ctx.ballpark || null;

  if (!starter?.name && !platoon && !park) return null;

  // Starter quality label from ERA
  const eraLabel = (era) => {
    if (era == null) return null;
    if (era < 2.5)  return { tone: 'good',    text: 'Elite' };
    if (era < 3.5)  return { tone: 'good',    text: 'Above avg' };
    if (era < 4.5)  return { tone: 'neutral', text: 'Average' };
    return { tone: 'bad', text: 'Below avg' };
  };
  const eraTag = eraLabel(starter?.era);

  const parkPct  = park?.parkFactor != null ? Math.round((park.parkFactor - 1) * 100) : null;
  const parkTone = parkPct == null ? 'neutral' : parkPct > 3 ? 'good' : parkPct < -3 ? 'bad' : 'neutral';
  const parkText = parkPct == null ? 'Neutral' : parkPct > 3 ? 'Hitter-friendly' : parkPct < -3 ? 'Pitcher-friendly' : 'Neutral';

  return (
    <div className={styles.matchup}>
      <div className={styles.matchupHeader}>
        <span className={styles.eyebrow}>Matchup</span>
      </div>

      {/* ── Opposing starter ─────────────────────────── */}
      {starter?.name && (
        <div className={styles.matchupRow}>
          <div className={styles.matchupRowLabel}>Facing</div>
          <div className={styles.matchupRowMain}>
            <div className={styles.starterName}>{starter.name}</div>
            <div className={styles.starterMeta}>
              {starter.hand && <span>{starter.hand === 'L' ? 'Left-handed' : starter.hand === 'S' ? 'Switch' : 'Right-handed'}</span>}
              {starter.era != null && <span><span className={styles.metaLbl}>ERA</span> <span className={styles.metaNum}>{starter.era}</span></span>}
              {starter.whip != null && <span><span className={styles.metaLbl}>WHIP</span> <span className={styles.metaNum}>{starter.whip}</span></span>}
              {starter.k9 != null && <span><span className={styles.metaLbl}>K/9</span> <span className={styles.metaNum}>{starter.k9}</span></span>}
            </div>
          </div>
          {eraTag && (
            <div className={`${styles.matchupBadge} ${styles[`badge_${eraTag.tone}`]}`}>{eraTag.text}</div>
          )}
        </div>
      )}

      {/* ── Platoon ──────────────────────────────────── */}
      {platoon && (platoon.batterHand || platoon.pitcherHand || platoon.matchupAvg != null) && (() => {
        // Plain-language wording — "R batter vs R pitcher" is much more
        // scannable than "RHB vs RHP" for non-baseball users. Also note
        // whether it's a same-hand or cross-hand matchup, which is the
        // whole point of showing this row.
        const bh = platoon.batterHand;
        const ph = platoon.pitcherHand;
        const sameHand   = bh && ph && bh === ph;
        const crossHand  = bh && ph && bh !== ph && bh !== 'S' && ph !== 'S';
        const handNote   = sameHand ? 'same-hand' : crossHand ? 'cross-hand' : null;
        return (
          <div className={styles.matchupRow}>
            <div className={styles.matchupRowLabel}>Platoon</div>
            <div className={styles.matchupRowMain}>
              <div className={styles.starterName}>
                {bh ? `${bh} batter` : 'Batter'}
                <span className={styles.matchupVs}>vs</span>
                {ph ? `${ph} pitcher` : 'Pitcher'}
                {handNote && <span className={styles.matchupNote}>{handNote}</span>}
              </div>
              {(platoon.matchupAvg != null || platoon.oppositeAvg != null) && (
                <div className={styles.starterMeta}>
                  {platoon.matchupAvg != null && (
                    <span>
                      <span className={styles.metaLbl}>AVG vs {ph || '—'}HP</span>{' '}
                      <span className={`${styles.metaNum} ${styles.metaNumStrong}`}>{fmtAvg(platoon.matchupAvg)}</span>
                    </span>
                  )}
                  {platoon.oppositeAvg != null && ph && (
                    <span>
                      <span className={styles.metaLbl}>vs {ph === 'L' ? 'R' : 'L'}HP</span>{' '}
                      <span className={styles.metaNum}>{fmtAvg(platoon.oppositeAvg)}</span>
                    </span>
                  )}
                  {platoon.matchupABs != null && (
                    <span className={styles.metaSample}>{platoon.matchupABs} at-bat sample</span>
                  )}
                </div>
              )}
            </div>
            {platoon.edge && (
              <div className={`${styles.matchupBadge} ${styles[`badge_${platoon.edge === 'favorable' ? 'good' : 'bad'}`]}`}>
                {platoon.edge === 'favorable' ? 'Favorable' : 'Tough'}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Ballpark ─────────────────────────────────── */}
      {park && (park.venueName || park.homeTeamName) && (
        <div className={styles.matchupRow}>
          <div className={styles.matchupRowLabel}>Ballpark</div>
          <div className={styles.matchupRowMain}>
            <div className={styles.starterName}>{park.venueName || park.homeTeamName}</div>
            {parkPct != null && (
              <div className={styles.starterMeta}>
                <span>
                  <span className={styles.metaLbl}>Park factor</span>{' '}
                  <span className={styles.metaNum}>{park.parkFactor?.toFixed(2)}</span>
                </span>
                <span>
                  <span className={styles.metaLbl}>{parkPct >= 0 ? '+' : ''}{parkPct}% vs avg</span>
                </span>
              </div>
            )}
          </div>
          {parkPct != null && (parkPct > 3 || parkPct < -3) && (
            <div className={`${styles.matchupBadge} ${styles[`badge_${parkTone}`]}`}>{parkText}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Copy pick button ─────────────────────────────────────────
function CopyPickButton({ insight }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const rec  = insight.recommendation?.toUpperCase() || '—';
    const edge = insight.edgePercentage
      ? `${insight.edgePercentage > 0 ? '+' : ''}${insight.edgePercentage}% edge` : '';
    const text = [
      `${insight.playerName} — ${getStatLabel('mlb', insight.statType)} ${rec} ${insight.bettingLine}`,
      insight.insightSummary?.split('.')[0] || '',
      edge,
      'via EdgeAI',
    ].filter(Boolean).join('\n');

    const write = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(write).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        write();
      });
    } else write();
  };
  return (
    <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy} type="button">
      {copied ? (
        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied</>
      ) : (
        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy pick</>
      )}
    </button>
  );
}

// ── Main modal ───────────────────────────────────────────────
export default function MLBInsightModal({ isOpen, onClose, insight, prop }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !insight) return null;

  const isOver       = insight.recommendation === 'over';
  const conf         = insight.confidenceScore ?? 0;
  const edge         = insight.edgePercentage;
  const statLabel    = getStatLabel('mlb', insight.statType);
  const isPitcher    = insight.statType === 'pitcher_strikeouts';
  const ctx          = insight.leagueContext || {};
  const playerSide   = ctx.playerSide;                             // 'home' | 'away' | null
  const opponentName = ctx.opponentName || null;                   // Full team name
  const opponentAbbr = ctx.opponentAbbr || null;                   // 3-letter code
  const ownAbbr      = playerSide === 'home' ? ctx.homeAbbr : playerSide === 'away' ? ctx.awayAbbr : null;
  const venueName    = ctx.ballpark?.venueName || null;
  const { dateLabel, timeLabel } = fmtGameDateTime(ctx.gameStartTime);
  const injury       = formatInjuryStatus(insight.injuryStatus);

  // Focus stat projection = the edge-window average (this is what the
  // signal calc uses). Used by the ProjectionBar.
  const projection = insight.focusStatAvg ?? null;

  // Sparkline data
  const recent = insight?.aiLog?.processedStats?.recentStatValues
              || insight?.recentStatValues
              || null;

  // Text blocks
  const summary = insight.insightSummary ? polishText(insight.insightSummary) : null;
  const factors = polishList(insight.insightFactors).slice(0, 4);
  const risks   = polishList(insight.insightRisks).slice(0, 4);

  // Displayed edge — cap ±100% because low lines (0.5) inflate the ratio.
  const edgeDisplay = (() => {
    if (edge == null || edge === 0) return null;
    const abs = Math.abs(edge);
    if (abs > 100) return `${edge > 0 ? '+' : '-'}100%+`;
    return `${edge > 0 ? '+' : ''}${edge}%`;
  })();
  const lowConf   = conf < 60;
  const edgeTone  = lowConf ? 'muted' : (edge > 0 ? 'good' : 'bad');

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
          <motion.div
            className={`${styles.modal} ${isOver ? styles.modalOver : styles.modalUnder}`}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top rail — tone-matched to recommendation */}
            <div className={styles.rail} />

            {/* Close button — hoisted out of the header flow so it's
                anchored to the modal's top-right corner on every
                viewport. On mobile the responsive header collapses to a
                single column and used to shove this button below the
                meta row; absolute positioning fixes that permanently. */}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* ── HEADER ─────────────────────────────── */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.eyebrow}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  AI scouting report
                </div>
                <h2 className={styles.playerName}>{insight.playerName}</h2>

                {/* Labeled meta row — each value is preceded by a tiny
                    small-caps label so casual users don't have to know
                    that "PIT" = team, "Line" = sportsbook total, etc.
                    Reads as three tagged data cells in a row. */}
                <div className={styles.playerMeta}>
                  {ownAbbr && (
                    <div className={styles.metaCell}>
                      <div className={styles.metaKey}>Team</div>
                      <div className={styles.metaVal}>{ownAbbr}</div>
                    </div>
                  )}
                  <div className={styles.metaCell}>
                    <div className={styles.metaKey}>Prop</div>
                    <div className={styles.metaVal}>{statLabel}</div>
                  </div>
                  <div className={styles.metaCell}>
                    <div className={styles.metaKey}>Sportsbook line</div>
                    <div className={styles.metaVal}>{insight.bettingLine}</div>
                  </div>
                  {injury && (
                    <div className={`${styles.metaCell} ${styles.metaCellInjury}`}>
                      <div className={styles.metaKey}>Status</div>
                      <div className={styles.metaVal}>⚠ {injury}</div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Plain-language matchup strip — replaces the cryptic
                "PIT @ PHI · time · Road" line. Consolidates every piece
                of game context (opponent, venue, date, time, home/away)
                into one strip so users have one place to look. */}
            {(opponentName || opponentAbbr || dateLabel || timeLabel) && (
              <div className={`${styles.matchupStrip} ${playerSide === 'home' ? styles.matchupStripHome : styles.matchupStripAway}`}>
                <div className={styles.matchupStripIcon} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {playerSide === 'home' ? (
                      // House icon — clearly reads as "home"
                      <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z"/></>
                    ) : (
                      // Location pin — reads as "playing AT this place",
                      // not "forward/next" like the old arrow.
                      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>
                    )}
                  </svg>
                </div>
                <div className={styles.matchupStripText}>
                  {(opponentName || opponentAbbr) && (
                    <div className={styles.matchupStripMain}>
                      {playerSide === 'home' ? (
                        <>Hosting <strong>{opponentName || opponentAbbr}</strong></>
                      ) : playerSide === 'away' ? (
                        <>Playing at <strong>{opponentName || opponentAbbr}</strong></>
                      ) : (
                        <>vs <strong>{opponentName || opponentAbbr}</strong></>
                      )}
                    </div>
                  )}
                  {(venueName || dateLabel || timeLabel) && (
                    <div className={styles.matchupStripVenue}>
                      {[venueName, dateLabel, timeLabel].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                {playerSide && (
                  <div className={`${styles.matchupStripBadge} ${playerSide === 'home' ? styles.matchupStripBadgeHome : styles.matchupStripBadgeAway}`}>
                    {playerSide === 'home' ? 'Home game' : 'Away game'}
                  </div>
                )}
              </div>
            )}

            {/* ── VERDICT ROW ────────────────────────── */}
            <div className={styles.verdictRow}>
              <Verdict recommendation={insight.recommendation} line={insight.bettingLine} />

              <div className={styles.verdictSupport}>
                {edgeDisplay && (
                  <div
                    className={`${styles.metric} ${styles[`metric_${edgeTone}`]}`}
                    title="Model Edge — gap between our projection and the book line. Not a win probability."
                  >
                    <div className={styles.metricVal}>{edgeDisplay}</div>
                    <div className={styles.metricLbl}>Model edge</div>
                  </div>
                )}
                <ConfidenceGauge value={conf} />
              </div>
            </div>

            {/* Meta tags — best value / high confidence / AI cert / data quality */}
            {(insight.isHighConfidence || insight.isBestValue || insight.aiConfidenceLabel) && (
              <div className={styles.metaTags}>
                {insight.isHighConfidence && <span className={`${styles.tag} ${styles.tagHC}`}>High confidence</span>}
                {insight.isBestValue      && <span className={`${styles.tag} ${styles.tagBV}`}>Best value</span>}
                {insight.aiConfidenceLabel && (
                  <span
                    className={`${styles.tag} ${styles.tagAI}`}
                    title="AI Certainty reflects LLM output stability. Signal Confidence reflects statistical support."
                  >
                    AI certainty: {insight.aiConfidenceLabel}
                  </span>
                )}
              </div>
            )}

            {/* ── PROJECTION BAR ─────────────────────── */}
            {!isPitcher && projection != null && insight.bettingLine != null && (
              <ProjectionBar
                line={insight.bettingLine}
                projection={projection}
                statLabel={statLabel}
                recommendation={insight.recommendation}
              />
            )}

            {/* ── RECENT FORM SPARKLINE ──────────────── */}
            {Array.isArray(recent) && recent.length > 0 && insight.bettingLine != null && (
              <RecentFormChart
                values={recent}
                line={insight.bettingLine}
                statLabel={statLabel}
                recommendation={insight.recommendation}
              />
            )}

            {/* ── MATCHUP PANEL ──────────────────────── */}
            {!isPitcher && <MatchupPanel insight={insight} />}

            {/* Pitcher path shows a compact context strip (park + injury only) */}
            {isPitcher && ctx?.ballpark?.venueName && (
              <div className={styles.pitcherPark}>
                <span className={styles.eyebrow}>Ballpark</span>
                <span className={styles.pitcherParkName}>{ctx.ballpark.venueName}</span>
                {ctx.ballpark.parkFactor != null && (
                  <span className={styles.pitcherParkFactor}>park factor {ctx.ballpark.parkFactor.toFixed(2)}</span>
                )}
              </div>
            )}

            {/* ── AI ANALYSIS ────────────────────────── */}
            {(summary || factors.length || risks.length) && (
              <div className={styles.analysis}>
                {summary && (
                  <motion.blockquote
                    className={styles.summary}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.35 }}
                  >
                    {summary}
                  </motion.blockquote>
                )}

                <div className={styles.reasonsGrid}>
                  {factors.length > 0 && (
                    <div className={styles.reasons}>
                      <div className={`${styles.reasonsHead} ${styles.reasonsHeadGood}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Supporting
                      </div>
                      <ul className={styles.reasonsList}>
                        {factors.map((f, i) => (
                          <li key={i} className={styles.reasonItem}>
                            <span className={`${styles.reasonDot} ${styles.reasonDotGood}`} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {risks.length > 0 && (
                    <div className={styles.reasons}>
                      <div className={`${styles.reasonsHead} ${styles.reasonsHeadBad}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                        Watch out
                      </div>
                      <ul className={styles.reasonsList}>
                        {risks.map((r, i) => (
                          <li key={i} className={styles.reasonItem}>
                            <span className={`${styles.reasonDot} ${styles.reasonDotBad}`} />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── FOOTER ─────────────────────────────── */}
            <div className={styles.footer}>
              <div className={styles.footerActions}>
                <span className={styles.footerActionsHint}>Save this pick or close the report</span>
                <div className={styles.footerBtns}>
                  <CopyPickButton insight={insight} />
                  <button className={styles.doneBtn} onClick={onClose} type="button">Got it</button>
                </div>
              </div>

              {/* Compact disclaimer — one paragraph. Names the product's
                  actual purpose (AI scouting), then flags the two things
                  users need to hear before acting on a pick: no
                  guarantees, verify lines, only stake what they can
                  afford. */}
              <div className={styles.legalNotice} role="note" aria-label="Disclaimer">
                <svg className={styles.legalIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div className={styles.legalText}>
                  <p><strong>AI-powered scouting to help you make more informed picks.</strong> Generated from historical stats and matchup context — no outcome is guaranteed. Verify current lines at your sportsbook before wagering, and only stake what you can afford to lose.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
