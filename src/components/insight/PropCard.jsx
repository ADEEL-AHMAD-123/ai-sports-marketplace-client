import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { selectIsLoggedIn, selectCredits, updateCredits } from '@/store/slices/authSlice';
import { setPendingInsightRequest } from '@/store/slices/uiSlice';
import { insightAPI, getErrorMsg } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import InsightModal from './InsightModal';
import styles from './PropCard.module.scss';

export default function PropCard({ prop, sport }) {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const credits    = useSelector(selectCredits);
  const [loading, setLoading]   = useState(false);
  const [insight, setInsight]   = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleUnlock = async () => {
    if (!isLoggedIn) {
      dispatch(setPendingInsightRequest({
        sport, eventId: prop.oddsEventId, playerName: prop.playerName,
        statType: prop.statType, bettingLine: prop.line, marketType: 'player_prop',
      }));
      window.location.href = '/login';
      return;
    }

    if (credits < 1) {
      toast.error('Not enough credits. Purchase more in your wallet.');
      return;
    }

    setLoading(true);
    try {
      const res = await insightAPI.unlock({
        sport, eventId: prop.oddsEventId, playerName: prop.playerName,
        statType: prop.statType, bettingLine: prop.line, marketType: 'player_prop',
      });

      if (res.data.preflightFailed) {
        toast.error(res.data.message || 'Odds changed. Please refresh.');
        return;
      }

      setInsight(res.data.insight);
      setModalOpen(true);

      if (res.data.creditDeducted) {
        dispatch(updateCredits(credits - 1));
        toast.success('Insight unlocked! 1 credit used.');
      } else {
        toast('Insight retrieved — no credit charged.');
      }
    } catch (e) {
      if (e.response?.status === 402) {
        toast.error('Not enough credits. Purchase more in your wallet.');
      } else {
        toast.error(getErrorMsg(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.playerInfo}>
            <p className={styles.playerName}>{prop.playerName}</p>
            {prop.teamName && <p className={styles.teamName}>{prop.teamName}</p>}
          </div>
          <div className={styles.tags}>
            {prop.isHighConfidence && <Badge variant="accent" dot>High Confidence</Badge>}
            {prop.isBestValue      && <Badge variant="warning" dot>Best Value</Badge>}
          </div>
        </div>

        {/* Prop line */}
        <div className={styles.propRow}>
          <div className={styles.statBlock}>
            <span className={styles.statType}>{prop.statType}</span>
            <span className={styles.line}>{prop.line}</span>
          </div>
          <div className={styles.oddsBlock}>
            <span className={styles.overOdds}>▲ {prop.overOdds > 0 ? '+' : ''}{prop.overOdds}</span>
            <span className={styles.underOdds}>▼ {prop.underOdds > 0 ? '+' : ''}{prop.underOdds}</span>
          </div>
        </div>

        {/* Metrics row */}
        {(prop.confidenceScore != null || prop.edgePercentage != null) && (
          <div className={styles.metrics}>
            {prop.confidenceScore != null && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Confidence</span>
                <span
                  className={styles.metricVal}
                  style={{ color: prop.confidenceScore >= 80 ? 'var(--color-accent)' : prop.confidenceScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}
                >
                  {prop.confidenceScore}%
                </span>
              </div>
            )}
            {prop.edgePercentage != null && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Edge</span>
                <span
                  className={styles.metricVal}
                  style={{ color: prop.edgePercentage > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}
                >
                  {prop.edgePercentage > 0 ? '+' : ''}{prop.edgePercentage}%
                </span>
              </div>
            )}
          </div>
        )}

        {prop.bookmaker && <p className={styles.bookmaker}>{prop.bookmaker}</p>}

        <Button
          variant="primary"
          size="sm"
          fullWidth
          loading={loading}
          onClick={handleUnlock}
        >
          {isLoggedIn ? '🔓 Unlock AI Insight (1 credit)' : '🔒 Log in to Unlock'}
        </Button>
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