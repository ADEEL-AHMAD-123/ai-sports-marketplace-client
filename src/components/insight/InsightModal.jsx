// src/components/insight/InsightModal.jsx
// Premium AI scouting report modal with structured sections
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InsightModal.module.scss';

// ── Parse AI text into structured sections ─────────────────────
// AI returns free-form paragraphs. We detect keywords and group them.
/**
 * Extract structured sections from insight.
 * NEW: AI now returns JSON directly — use insightSummary, insightFactors, insightRisks.
 * FALLBACK: If old free-text insight, parse it minimally.
 */
function getInsightSections(insight) {
  // New structured format (from JSON response)
  if (insight.insightFactors?.length || insight.insightSummary) {
    return {
      summary: insight.insightSummary ? [insight.insightSummary] : [],
      factors: insight.insightFactors || [],
      risks:   insight.insightRisks   || [],
      raw:     [],
      isStructured: true,
    };
  }

  // Fallback: parse old free-text format
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
  const dash  = (pct / 100) * circ * 0.75; // 270° arc
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className={styles.arcWrap}>
      <svg width="112" height="112" viewBox="0 0 112 112">
        {/* Background track */}
        <circle cx="56" cy="56" r={r}
          fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth="8" strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={0} strokeLinecap="round"
          transform="rotate(135 56 56)"
        />
        {/* Animated fill */}
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
        {/* Glow dot at arc tip — calculated position on 270° arc */}
        {(() => {
          const angle = 135 + (pct / 100) * 270; // degrees
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
      'via EdgeIQ',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for non-HTTPS
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

// ── Stat Windows — Peter St John's two-group design ────────────
// Season Baseline (last 30): what the bookmaker's line reflects
// Last N Games (last 5):     what the player is doing RIGHT NOW
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

function StatWindows({ insight }) {
  const {
    focusStatAvg, bettingLine: line, statType,
    formPoints, formRebounds, formAssists, formThrees,
    formMinutes, formGamesCount = 5,
    baselineStatAvg, baselineMinutes, baselineGamesCount = 30,
    trueShootingPct, effectiveFGPct, approxUSGPct,
  } = insight;

  const formStat = { points: formPoints, rebounds: formRebounds, assists: formAssists, threes: formThrees }[statType];
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
  const { summary, factors, risks, raw, isStructured } = getInsightSections(insight);

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
            {/* Top gradient bar */}
            <div className={`${styles.topBar} ${isOver ? styles.topBarOver : styles.topBarUnder}`} />

            {/* Header row */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <p className={styles.headerEyebrow}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  AI Scouting Report
                </p>
                <h2 className={styles.playerName}>{insight.playerName}</h2>
                <p className={styles.statLine}>
                  <span className={styles.statBadge}>{insight.statType}</span>
                  {insight.injuryStatus && ['out','questionable','doubtful'].includes(insight.injuryStatus) && (
                    <span className={styles.injuryBadge}>
                      ⚠ {insight.injuryStatus.charAt(0).toUpperCase() + insight.injuryStatus.slice(1)}
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

            {/* Verdict + metrics row */}
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
                  {insight.dataQuality === 'strong' && conf >= 70 && (
                    <span className={styles.tagStrong}>✓ Strong Data</span>
                  )}
                  {insight.dataQuality === 'weak' && conf < 80 && (
                    <span className={styles.tagWeak}>⚠ Limited Data</span>
                  )}
                  {insight.aiConfidenceLabel && (
                    <span className={styles.tagAiConf}>AI: {insight.aiConfidenceLabel}</span>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Stat windows — two labelled sections */}
            {(insight.baselineStatAvg != null || insight.formPoints != null) && (
              <StatWindows insight={insight} />
            )}

            {/* Divider */}
            <div className={styles.divider} style={{ margin: '0 28px 0' }} />

            {/* Insight sections */}
            <div className={styles.body}>
              {/* Summary */}
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

              {/* Supporting factors — first item is the primary signal, styled bolder */}
              <Section
                icon="📊"
                label="Supporting Factors"
                items={[...factors, ...raw].slice(0, 4)}
                color="#22c55e"
                delay={0.35}
                boldFirst
              />

              {/* Risk factors */}
              <Section
                icon="⚠️"
                label="Risk Factors"
                items={risks}
                color="#f59e0b"
                delay={0.45}
              />

              {/* If no structured sections, show raw paragraphs */}
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