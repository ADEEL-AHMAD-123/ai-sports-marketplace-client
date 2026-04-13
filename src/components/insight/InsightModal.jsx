// src/components/insight/InsightModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InsightModal.module.scss';

// ── Icons ─────────────────────────────────────────────────────
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function InsightModal({ isOpen, onClose, insight, prop }) {
  if (!isOpen || !insight) return null;

  const isOver   = insight.recommendation === 'over';
  const conf     = insight.confidenceScore;
  const edge     = insight.edgePercentage;

  // Confidence bar color
  const confColor = conf >= 80 ? 'var(--color-accent)'
    : conf >= 60 ? 'var(--color-warning)'
    : 'var(--color-danger)';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Top accent line */}
            <div className={styles.topBar} />

            {/* Header */}
            <div className={styles.header}>
              <div>
                <p className={styles.headerLabel}>AI Scouting Report</p>
                <h2 className={styles.headerTitle}>{insight.playerName}</h2>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>
                <CloseIcon />
              </button>
            </div>

            {/* Prop summary row */}
            <div className={styles.propSummary}>
              <div className={styles.propBlock}>
                <span className={styles.propLabel}>{insight.statType}</span>
                <span className={styles.propLine}>{insight.bettingLine}</span>
              </div>

              <div className={styles.propDivider} />

              <div className={styles.recBlock}>
                <span className={styles.recLabel}>Recommendation</span>
                <span className={`${styles.rec} ${isOver ? styles.recOver : styles.recUnder}`}>
                  {isOver ? '▲ OVER' : '▼ UNDER'} {insight.bettingLine}
                </span>
              </div>

              {conf != null && (
                <>
                  <div className={styles.propDivider} />
                  <div className={styles.propBlock}>
                    <span className={styles.propLabel}>Confidence</span>
                    <span className={styles.propLine} style={{ color: confColor }}>{conf}%</span>
                  </div>
                </>
              )}

              {edge != null && (
                <>
                  <div className={styles.propDivider} />
                  <div className={styles.propBlock}>
                    <span className={styles.propLabel}>Edge</span>
                    <span className={styles.propLine} style={{ color: edge > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                      {edge > 0 ? '+' : ''}{edge}%
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Confidence bar */}
            {conf != null && (
              <div className={styles.confBarWrap}>
                <div className={styles.confBarTrack}>
                  <motion.div
                    className={styles.confBarFill}
                    style={{ background: confColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${conf}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  />
                </div>
                <span className={styles.confBarLabel}>{conf}% confidence based on recent form</span>
              </div>
            )}

            {/* AI insight text */}
            <div className={styles.insightBody}>
              <div className={styles.insightLabel}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Scout Analysis
              </div>
              <div className={styles.insightText}>
                {insight.insightText
                  ? insight.insightText.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i} className={styles.insightLine}>{line}</p>
                    ))
                  : <p className={styles.insightLine}>No analysis available.</p>
                }
              </div>
            </div>

            {/* Tags */}
            {(insight.isHighConfidence || insight.isBestValue) && (
              <div className={styles.tags}>
                {insight.isHighConfidence && (
                  <span className={styles.tagConf}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    High Confidence
                  </span>
                )}
                {insight.isBestValue && (
                  <span className={styles.tagVal}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Best Value
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className={styles.footer}>
              <p className={styles.disclaimer}>
                AI-generated analysis. Not financial advice. Bet responsibly.
              </p>
              <button className={styles.doneBtn} onClick={onClose}>Done</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}