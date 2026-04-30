// src/components/insight/InsightModal.jsx
// Premium AI scouting report modal with structured sections
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getStatLabel,
  shouldShowStrongDataBadge,
  shouldShowWeakDataBadge,
} from '@/config/sportConfig';
import styles from './InsightModal.module.scss';

const normalizeInjuryStatus = (value) => String(value || '').trim().toLowerCase();

const formatInjuryStatus = (value) => {
  const normalized = normalizeInjuryStatus(value);
  if (!normalized) return null;
  if (normalized === 'day-to-day') return 'Day-to-Day';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

/**
 * Extract structured sections from insight.
 * AI returns JSON — use insightSummary, insightFactors, insightRisks.
 * Falls back to parsing insightText for older records.
 */
function getInsightSections(insight) {
  if (insight.insightFactors?.length || insight.insightSummary) {
    return {
      summary: insight.insightSummary ? [insight.insightSummary] : [],
      factors: insight.insightFactors || [],
      risks:   insight.insightRisks   || [],
      raw:     [],
      isStructured: true,
    };
  }

  const text = insight.insightText || '';
  if (!text) return { summary: [], factors: [], risks: [], raw: [], isStructured: false };

  const lines = text
    .split('\n')
    .map(l => l.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[\d.\-•*#>]+\s*/, '').trim())
    .filter(l => l.length > 10)
    .filter(l => !/^Recommendation:/i.test(l))
    .filter(l => !/^Confidence Level:/i.test(l))
    .filter(l => !/^Reasons?:\s*$/i.test(l));

  const riskKws = /\b(risk|concern|however|but|injury|limited|minutes|struggle|variance)/i;
  const summary = lines.slice(0, 1);
  const rest    = lines.slice(1);
  const factors = rest.filter(l => !riskKws.test(l)).slice(0, 3);
  const risks   = rest.filter(l => riskKws.test(l)).slice(0, 2);

  return { summary, factors, risks, raw: [], isStructured: false };
}

// ── Animated confidence arc ────────────────────────────────────
function ConfidenceArc({ score }) {
  const pct   = Math.min(100, Math.max(0, score || 0));
  const r     = 44;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ * 0.75;
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className={styles.arcWrap}>
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r}
          fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth="8" strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={0} strokeLinecap="round"
          transform="rotate(135 56 56)"
        />
        <motion.circle cx="56" cy="56" r={r}
          fill="none" stroke={color}
          strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeLinecap="round"
          transform="rotate(135 56 56)"
          initial={{ strokeDashoffset: circ * 0.75 }}
          animate={{ strokeDashoffset: circ * 0.75 - dash }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        {(() => {
          const angle = 135 + (pct / 100) * 270;
          const rad   = (angle * Math.PI) / 180;
          const cx    = 56 + r * Math.cos(rad);
          const cy    = 56 + r * Math.sin(rad);
          return (
            <motion.circle cx={cx} cy={cy} r="4" fill={color}
              style={{ filter: `drop-shadow(0 0 5px ${color})` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3, type: 'spring' }}
            />
          );
        })()}
      </svg>
      <div className={styles.arcCenter}>
        <motion.span
          className={styles.arcScore}
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {pct}
        </motion.span>
        <span className={styles.arcLabel}>CONF</span>
      </div>
    </div>
  );
}

// ── Verdict chip ───────────────────────────────────────────────
function Verdict({ rec, line }) {
  const isOver = rec === 'over';
  return (
    <motion.div
      className={`${styles.verdict} ${isOver ? styles.verdictOver : styles.verdictUnder}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
    >
      <span className={styles.verdictArrow}>{isOver ? '▲' : '▼'}</span>
      <span className={styles.verdictText}>{isOver ? 'OVER' : 'UNDER'}</span>
      <span className={styles.verdictLine}>{line}</span>
    </motion.div>
  );
}

// ── Copy Pick button ────────────────────────────────────────────
function CopyPickButton({ insight }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const rec  = insight.recommendation?.toUpperCase() || '—';
    const edge = insight.edgePercentage ? `${insight.edgePercentage > 0 ? '+' : ''}${insight.edgePercentage}% edge` : '';
    const tags = [insight.isHighConfidence && 'HC', insight.isBestValue && 'BV'].filter(Boolean).join(' · ');
    const text = [
      `${insight.playerName} — ${insight.statType?.toUpperCase()} ${rec} ${insight.bettingLine}`,
      insight.insightSummary?.split('.')[0] || '',
      [edge, tags].filter(Boolean).join(' · '),
      'via SignalDraft',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
      {copied ? (
        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
      ) : (
        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Pick</>
      )}
    </button>
  );
}

// ── Section component ──────────────────────────────────────────
function Section({ icon, label, items, color, delay = 0, boldFirst = false }) {
  if (!items?.length) return null;
  return (
    <motion.div
      className={styles.section}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon} style={{ background: `${color}18`, color }}>{icon}</span>
        <span className={styles.sectionLabel} style={{ color }}>{label}</span>
      </div>
      <div className={styles.sectionItems}>
        {items.map((item, i) => (
          <div key={i} className={`${styles.sectionItem} ${boldFirst && i === 0 ? styles.sectionItemFirst : ''}`}>
            <span className={styles.itemDot} style={{ background: color }} />
            <p className={styles.itemText}>{item}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Stat Row ───────────────────────────────────────────────────
function StatRow({ label, value, highlight }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statRowLabel}>{label}</span>
      <span className={styles.statRowVal} style={highlight ? { color: highlight } : {}}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ── Stat Windows ───────────────────────────────────────────────
// FIX: MLB stats are saved as flat fields on the Insight document.
// Backend InsightService.create() saves hitsPerG, tbPerG, battingAvg, obp, slg,
// kPerStart, era, whip, k9 etc directly — NOT inside leagueContext.processedStats.
function StatWindows({ insight }) {
  const sport    = insight?.sport;
  const statType = insight?.statType;

  if (sport === 'mlb') {
    const isPitcher      = statType === 'pitcher_strikeouts';
    const formCount      = insight?.formGamesCount      ?? 5;
    const baselineCount  = insight?.baselineGamesCount  ?? 30;
    const edgeCount      = insight?.edgeGamesCount      ?? 15;

    if (isPitcher) {
      return (
        <div className={styles.windows}>
          <div className={styles.window}>
            <div className={styles.windowHdr}>
              <span className={styles.windowDot} style={{ background: '#6366f1' }} />
              <span className={styles.windowTitle}>Season Baseline</span>
              <span className={styles.windowSub}>Last {baselineCount} starts</span>
            </div>
            <StatRow label="K/start"    value={insight.baselineStatAvg} />
            <StatRow label="ERA"        value={insight.era} />
            <StatRow label="WHIP"       value={insight.whip} />
            <StatRow label="IP/start"   value={insight.ipPerStart} />
          </div>
          <div className={styles.window}>
            <div className={styles.windowHdr}>
              <span className={styles.windowDot} style={{ background: '#22c55e' }} />
              <span className={styles.windowTitle}>Recent Form</span>
              <span className={styles.windowSub}>Last {formCount} starts</span>
            </div>
            {/* focusStatAvg = edge window K/start (primary signal) */}
            <StatRow label="K/start"      value={insight.focusStatAvg} />
            <StatRow label="Form K/start" value={insight.formKPerStart} />
            <StatRow label="K/9"          value={insight.k9} />
          </div>
        </div>
      );
    }

    // MLB batter — reads flat fields saved by InsightService
    const statLabel = getStatLabel('mlb', statType);
    const formNum   = parseFloat(insight.formStatAvg);
    const lineNum   = parseFloat(insight.bettingLine);
    const trendUp   = !isNaN(formNum) && !isNaN(lineNum) && formNum > lineNum;
    const trendClr  = (!isNaN(formNum) && !isNaN(lineNum)) ? (trendUp ? '#22c55e' : '#ef4444') : undefined;

    return (
      <div className={styles.windows}>
        <div className={styles.window}>
          <div className={styles.windowHdr}>
            <span className={styles.windowDot} style={{ background: '#6366f1' }} />
            <span className={styles.windowTitle}>Season Baseline</span>
            <span className={styles.windowSub}>Last {baselineCount} games</span>
          </div>
          <StatRow label={`${statLabel}/g`} value={insight.baselineStatAvg} />
          <StatRow label="AVG"              value={insight.battingAvg} />
          <StatRow label="OBP"              value={insight.obp} />
          <StatRow label="SLG"              value={insight.slg} />
          <StatRow label="OPS"              value={insight.ops} />
        </div>
        <div className={styles.window}>
          <div className={styles.windowHdr}>
            <span className={styles.windowDot} style={{ background: '#22c55e' }} />
            <span className={styles.windowTitle}>Recent Form</span>
            <span className={styles.windowSub}>Last {formCount} games</span>
          </div>
          {/* focusStatAvg = edge window avg (15g), formStatAvg = form window avg (10g) */}
          <StatRow label={`${statLabel}/g (15g)`} value={insight.focusStatAvg} />
          <StatRow label={`${statLabel}/g (10g)`} value={insight.formStatAvg} highlight={trendClr} />
          <StatRow label="Hits/g"  value={insight.hitsPerG} />
          <StatRow label="TB/g"    value={insight.tbPerG} />
          <StatRow label="Runs/g"  value={insight.runsPerG} />
        </div>
      </div>
    );
  }

  // NHL — shots/goals/assists
  if (sport === 'nhl') {
    const statLabel    = getStatLabel('nhl', statType);
    const formCount    = insight?.formGamesCount    ?? 5;
    const edgeCount    = insight?.edgeGamesCount    ?? 10;
    const baseCount    = insight?.baselineGamesCount ?? 30;
    const formNum      = parseFloat(insight.formStatAvg);
    const lineNum      = parseFloat(insight.bettingLine);
    const trendUp      = !isNaN(formNum) && !isNaN(lineNum) && formNum > lineNum;
    const trendClr     = (!isNaN(formNum) && !isNaN(lineNum)) ? (trendUp ? '#22c55e' : '#ef4444') : undefined;

    return (
      <div className={styles.windows}>
        <div className={styles.window}>
          <div className={styles.windowHdr}>
            <span className={styles.windowDot} style={{ background: '#6366f1' }} />
            <span className={styles.windowTitle}>Season Baseline</span>
            <span className={styles.windowSub}>Last {baseCount} games</span>
          </div>
          <StatRow label={`${statLabel}/g`} value={insight.baselineStatAvg} />
          <StatRow label="Goals/g"   value={insight.goalsPerG} />
          <StatRow label="Assists/g" value={insight.assistsPerG} />
          <StatRow label="Shots/g"   value={insight.shotsPerG} />
        </div>
        <div className={styles.window}>
          <div className={styles.windowHdr}>
            <span className={styles.windowDot} style={{ background: '#22c55e' }} />
            <span className={styles.windowTitle}>Recent Form</span>
            <span className={styles.windowSub}>Last {formCount} games</span>
          </div>
          <StatRow label={`${statLabel}/g (${edgeCount}g)`} value={insight.focusStatAvg} />
          <StatRow label={`${statLabel}/g (${formCount}g)`} value={insight.formStatAvg} highlight={trendClr} />
          <StatRow label="TOI/g"     value={insight.toiPerG != null ? `${insight.toiPerG}min` : null} />
        </div>
      </div>
    );
  }

  // NBA — reads existing flat fields (unchanged)
  const {
    focusStatAvg, bettingLine: line, statType: nbaStatType,
    formPoints, formRebounds, formAssists, formThrees, formPointsAssists,
    formMinutes, formGamesCount = 5,
    baselineStatAvg, baselineMinutes, baselineGamesCount = 30,
    trueShootingPct, effectiveFGPct, approxUSGPct,
  } = insight;

  const formStat = {
    points:         formPoints,
    rebounds:       formRebounds,
    assists:        formAssists,
    threes:         formThrees,
    points_assists: insight.formPointsAssists,
  }[nbaStatType];
  const formNum  = parseFloat(formStat);
  const lineNum  = parseFloat(line);
  const trendUp  = !isNaN(formNum) && !isNaN(lineNum) && formNum > lineNum;
  const trendClr = (!isNaN(formNum) && !isNaN(lineNum)) ? (trendUp ? '#22c55e' : '#ef4444') : undefined;

  return (
    <div className={styles.windows}>
      <div className={styles.window}>
        <div className={styles.windowHdr}>
          <span className={styles.windowDot} style={{ background: '#6366f1' }} />
          <span className={styles.windowTitle}>Season Baseline</span>
          <span className={styles.windowSub}>Last {baselineGamesCount} games</span>
        </div>
        <StatRow label="Season avg"  value={baselineStatAvg} />
        <StatRow label="Minutes"     value={baselineMinutes} />
        <StatRow label="TS%"         value={trueShootingPct != null && trueShootingPct <= 100 ? `${trueShootingPct}%` : null} />
        <StatRow label="eFG%"        value={effectiveFGPct  != null && effectiveFGPct  <= 100 ? `${effectiveFGPct}%`  : null} />
        <StatRow label="USG%"        value={approxUSGPct    ? `${approxUSGPct}%`    : null} />
      </div>
      <div className={styles.window}>
        <div className={styles.windowHdr}>
          <span className={styles.windowDot} style={{ background: '#22c55e' }} />
          <span className={styles.windowTitle}>Last {formGamesCount} Games</span>
          <span className={styles.windowSub}>Current form</span>
        </div>
        <StatRow label="Form avg"    value={formStat}        highlight={trendClr} />
        <StatRow label="Minutes"     value={formMinutes} />
        <StatRow label="10-game avg" value={focusStatAvg} />
        <StatRow label="vs Line"     value={!isNaN(formNum) && !isNaN(lineNum) ? `${trendUp ? '▲ OVER' : '▼ UNDER'} signal` : '—'} highlight={trendClr} />
      </div>
    </div>
  );
}

// Check if stat windows should render — true if any relevant field exists
function hasStatData(insight) {
  const sport = insight?.sport;
  if (sport === 'mlb') {
    return insight.focusStatAvg != null
      || insight.baselineStatAvg != null
      || insight.hitsPerG != null
      || insight.kPerStart != null;
  }
  if (sport === 'nhl') {
    return insight.focusStatAvg != null || insight.shotsPerG != null;
  }
  return insight.baselineStatAvg != null || insight.formPoints != null;
}

// ── Main modal ─────────────────────────────────────────────────
export default function InsightModal({ isOpen, onClose, insight, prop }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !insight) return null;

  const isOver = insight.recommendation === 'over';
  const conf   = insight.confidenceScore ?? 0;
  const edge   = insight.edgePercentage;
  const sport  = insight.sport || prop?.sport;
  const { summary, factors, risks, raw } = getInsightSections(insight);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 280, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div className={`${styles.topBar} ${isOver ? styles.topBarOver : styles.topBarUnder}`} />

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <p className={styles.headerEyebrow}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  AI Scouting Report
                </p>
                <h2 className={styles.playerName}>{insight.playerName}</h2>
                <p className={styles.statLine}>
                  <span className={styles.statBadge}>{getStatLabel(sport, insight.statType)}</span>
                  {formatInjuryStatus(insight.injuryStatus) && (
                    <span className={styles.injuryBadge}>
                      ⚠ {formatInjuryStatus(insight.injuryStatus)}
                    </span>
                  )}
                  <span className={styles.statSep}>·</span>
                  Line: <strong>{insight.bettingLine}</strong>
                </p>
              </div>

              <div className={styles.headerRight}>
                <ConfidenceArc score={conf} />
              </div>

              <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Metrics row */}
            <div className={styles.metricsRow}>
              {insight.recommendation && (
                <Verdict rec={insight.recommendation} line={insight.bettingLine} />
              )}

              {edge != null && edge !== 0 && (
                <div className={styles.metric}>
                  <span className={styles.metricVal} style={{ color: edge > 0 ? '#22c55e' : '#ef4444' }}>
                    {edge > 0 ? '+' : ''}{edge}%
                  </span>
                  <span className={styles.metricLbl}>Edge</span>
                </div>
              )}

              <div className={styles.metric}>
                <span className={styles.metricVal}>{conf}%</span>
                <span className={styles.metricLbl}>Confidence</span>
              </div>

              {(insight.isHighConfidence || insight.isBestValue || insight.dataQuality || insight.aiConfidenceLabel) && (
                <div className={styles.tags}>
                  {insight.isHighConfidence && <span className={styles.tagHC}>HC</span>}
                  {insight.isBestValue      && <span className={styles.tagBV}>BV</span>}
                  {shouldShowStrongDataBadge(sport, insight.dataQuality, conf) && (
                    <span className={styles.tagStrong}>✓ Strong Data</span>
                  )}
                  {shouldShowWeakDataBadge(sport, insight.dataQuality, conf) && (
                    <span className={styles.tagWeak}>⚠ Limited Data</span>
                  )}
                  {insight.aiConfidenceLabel && (
                    <span className={styles.tagAiConf}>AI: {insight.aiConfidenceLabel}</span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.divider} />

            {/* Stat windows — only shown when data exists */}
            {hasStatData(insight) && <StatWindows insight={insight} />}

            <div className={styles.divider} style={{ margin: '0 28px 0' }} />

            {/* Insight sections */}
            <div className={styles.body}>
              {summary.length > 0 && (
                <motion.div
                  className={styles.summary}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  {summary.map((line, i) => (
                    <p key={i} className={styles.summaryText}>{line}</p>
                  ))}
                </motion.div>
              )}

              <Section
                icon="📊"
                label="Supporting Factors"
                items={[...factors, ...raw].slice(0, 4)}
                color="#22c55e"
                delay={0.35}
                boldFirst
              />

              <Section
                icon="⚠️"
                label="Risk Factors"
                items={risks}
                color="#f59e0b"
                delay={0.45}
              />

              {!factors.length && !risks.length && !summary.length && (
                <motion.div
                  className={styles.rawText}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {insight.insightText?.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className={styles.rawLine}>{line}</p>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <p className={styles.disclaimer}>
                AI-generated analysis for informational purposes only. Not financial advice. Bet responsibly.
              </p>
              <div className={styles.footerBtns}>
                <CopyPickButton insight={insight} />
                <button className={styles.doneBtn} onClick={onClose}>Got it</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

