// src/components/insight/PropCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUnlock } from '@/hooks/useInsights';
import InsightModal from './InsightModal';
import { Spinner } from '@/components/ui/Skeleton';
import { getSportBadges, getStatLabel, getStatTypeBadge } from '@/config/sportConfig';
import styles from './PropCard.module.scss';

const normalizeInjuryStatus = (value) => String(value || '').trim().toLowerCase();

const getInjuryBadge = (status) => {
  const normalized = normalizeInjuryStatus(status);
  if (!normalized) return null;
  if (normalized === 'out') return { label: 'OUT', className: styles.badgeOut };
  if (normalized === 'questionable') return { label: 'Q', className: styles.badgeQ };
  if (normalized === 'doubtful' || normalized === 'day-to-day') return { label: 'DTD', className: styles.badgeDTD };
  return { label: normalized.toUpperCase(), className: styles.badgeDTD };
};

function ConfBar({ score }) {
  if (score == null || score === 0) return null;
  const color = score >= 80 ? 'var(--color-accent)'
    : score >= 60 ? 'var(--color-warning)'
    : 'var(--color-danger)';
  return (
    <div className={styles.confBar}>
      <div className={styles.confTrack}>
        <motion.div
          className={styles.confFill}
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className={styles.confLabel} style={{ color }}>{score}%</span>
    </div>
  );
}

export default function PropCard({ prop, sport }) {
  const [modalOpen, setModalOpen] = useState(false);
  const sportBadges = getSportBadges(prop?.sport || sport);
  const statTypeBadge = getStatTypeBadge(prop?.sport || sport, prop?.statType);

  const {
    unlock,
    isUnlocking,
    isUnlocked,
    insight,
    canUnlock,
    blockedInfo,
    isInjuryBlocked,
  } = useUnlock(prop, sport);

  // Keep card metrics aligned with unlocked report when an insight exists.
  const displayLine = isUnlocked && insight?.bettingLine != null ? insight.bettingLine : prop.line;
  const displayConfidence = isUnlocked && insight?.confidenceScore != null ? insight.confidenceScore : prop.confidenceScore;
  const displayEdge = isUnlocked && insight?.edgePercentage != null ? insight.edgePercentage : prop.edgePercentage;
  const showHighConfidence = isUnlocked && insight ? !!insight.isHighConfidence : !!prop.isHighConfidence;
  const showBestValue      = isUnlocked && insight ? !!insight.isBestValue      : !!prop.isBestValue;

  const displayInjury = blockedInfo?.status
    ? { status: blockedInfo.status, reason: blockedInfo.reason || blockedInfo.message }
    : insight?.injuryStatus
      ? { status: insight.injuryStatus, reason: insight.injuryReason }
      : prop?.injuryStatus
        ? { status: prop.injuryStatus, reason: prop.injuryReason }
        : null;
  const injuryBadge = getInjuryBadge(displayInjury?.status);

  const handleClick = async () => {
    if (isUnlocked && insight) {
      setModalOpen(true);
      return;
    }
    const result = await unlock();
    if (result?.success) {
      setModalOpen(true);
    }
  };

  return (
    <>
      <motion.div
        className={`${styles.card} ${isUnlocked ? styles.cardUnlocked : ''} ${isInjuryBlocked ? styles.cardBlocked : ''}`}
        whileHover={!isInjuryBlocked ? { y: -2, transition: { duration: 0.12 } } : {}}
      >
        {isUnlocked && <div className={styles.unlockedBar} />}

        {/* ── Header row: player name + badges ─────────────────────── */}
        <div className={styles.header}>
          <div className={styles.playerInfo}>
            <p className={styles.playerName}>{prop.playerName}</p>
            {prop.teamName && (
              <p className={styles.teamName}>{prop.teamName}</p>
            )}
          </div>
          <div className={styles.badges}>
            {showHighConfidence && <span className={styles.badgeHC}>{sportBadges.highConfidenceLabel || 'HC'}</span>}
            {showBestValue      && <span className={styles.badgeBV}>{sportBadges.bestValueLabel || 'BV'}</span>}
            {isUnlocked         && <span className={styles.badgeUnlocked} title="Unlocked">✓</span>}
            {injuryBadge && (
              <span className={injuryBadge.className} title={displayInjury?.reason || displayInjury?.status}>
                ⚠ {injuryBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* ── Stat + line — the most prominent visual ─────────────── */}
        <div className={styles.propRow}>
          <div className={styles.statBlock}>
            <span className={styles.statType}>
              {getStatLabel(prop.sport, prop.statType)}
              {statTypeBadge && (
                <span className={styles.pitcherHandBadge} title={statTypeBadge.title || statTypeBadge.label}>
                  {statTypeBadge.label}
                </span>
              )}
            </span>
            <span className={styles.line}>{displayLine}</span>
          </div>
          {(prop.overOdds != null || prop.underOdds != null) && (
            <div className={styles.oddsBlock}>
              {prop.overOdds  != null && (
                <div className={styles.oddsItem}>
                  <span className={styles.oddsDirOver}>▲</span>
                  <span className={styles.oddsVal}>{prop.overOdds  > 0 ? '+' : ''}{prop.overOdds}</span>
                </div>
              )}
              {prop.underOdds != null && (
                <div className={styles.oddsItem}>
                  <span className={styles.oddsDirUnder}>▼</span>
                  <span className={styles.oddsVal}>{prop.underOdds > 0 ? '+' : ''}{prop.underOdds}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Confidence + edge in one row ─────────────────────────── */}
        {(displayConfidence != null || (displayEdge != null && displayEdge !== 0)) && (
          <div className={styles.metricsRow}>
            {displayConfidence != null && (
              <div className={styles.metricsLeft}>
                <ConfBar score={displayConfidence} />
              </div>
            )}
            {displayEdge != null && displayEdge !== 0 && (
              <span
                className={styles.edgePill}
                style={{
                  color: displayEdge > 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                  background: displayEdge > 0 ? 'var(--color-accent-dim)' : 'rgba(var(--color-danger-rgb), 0.10)',
                  borderColor: displayEdge > 0 ? 'rgba(var(--color-accent-rgb), 0.30)' : 'rgba(var(--color-danger-rgb), 0.30)',
                }}
              >
                {displayEdge > 0 ? '+' : ''}{displayEdge}%
              </span>
            )}
          </div>
        )}

        {/* ── Injury blocker message ───────────────────────────────── */}
        {isInjuryBlocked && (
          <div className={styles.blockerMessage}>
            <span className={styles.blockerIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <span className={styles.blockerText}>
              {blockedInfo?.message || 'Player unavailable — insight locked'}
            </span>
          </div>
        )}

        {/* ── Footer: bookmaker + CTA ──────────────────────────────── */}
        <div className={styles.cardFooter}>
          {prop.bookmaker && <span className={styles.bookmaker}>{prop.bookmaker}</span>}
          <button
            className={`${styles.cta} ${isUnlocked ? styles.ctaDone : ''}`}
            onClick={handleClick}
            disabled={isUnlocking || isInjuryBlocked}
          >
            {isUnlocking ? (
              <Spinner size={18} color="currentColor" />
            ) : isUnlocked ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span>View Report</span>
              </>
            ) : isInjuryBlocked ? (
              <span>Unavailable</span>
            ) : canUnlock ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                <span>Unlock — 1 Credit</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Log in to Unlock</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      <InsightModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        insight={insight}
        prop={prop}
      />
    </>
  );
}
