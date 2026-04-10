import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import styles from './InsightModal.module.scss';

export default function InsightModal({ isOpen, onClose, insight, prop }) {
  if (!insight) return null;

  const isOver = insight.recommendation === 'over';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Insight" size="md">
      <div className={styles.wrap}>

        {/* Prop summary */}
        <div className={styles.propHeader}>
          <div>
            <p className={styles.player}>{insight.playerName}</p>
            <p className={styles.statLine}>
              {insight.statType} — Line:{' '}
              <span className={styles.line}>{insight.bettingLine}</span>
            </p>
          </div>
          {insight.recommendation && (
            <Badge variant={isOver ? 'over' : 'under'} className={styles.rec}>
              {isOver ? '▲ OVER' : '▼ UNDER'}
            </Badge>
          )}
        </div>

        {/* Metrics */}
        {(insight.confidenceScore != null || insight.edgePercentage != null) && (
          <div className={styles.metrics}>
            {insight.confidenceScore != null && (
              <div className={styles.metric}>
                <span className={styles.mLabel}>Confidence</span>
                <span
                  className={styles.mVal}
                  style={{
                    color: insight.confidenceScore >= 80 ? 'var(--color-accent)'
                      : insight.confidenceScore >= 60 ? 'var(--color-warning)'
                      : 'var(--color-danger)',
                  }}
                >
                  {insight.confidenceScore}%
                </span>
              </div>
            )}
            {insight.edgePercentage != null && (
              <div className={styles.metric}>
                <span className={styles.mLabel}>Edge</span>
                <span
                  className={styles.mVal}
                  style={{ color: insight.edgePercentage > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}
                >
                  {insight.edgePercentage > 0 ? '+' : ''}{insight.edgePercentage}%
                </span>
              </div>
            )}
            {insight.isHighConfidence && <Badge variant="accent" dot>High Confidence</Badge>}
            {insight.isBestValue      && <Badge variant="warning" dot>Best Value</Badge>}
          </div>
        )}

        {/* AI insight text */}
        <div className={styles.insightBox}>
          <p className={styles.insightLabel}>AI Analysis</p>
          <p className={styles.insightText}>{insight.insightText}</p>
        </div>

        {/* Disclaimer */}
        <p className={styles.disclaimer}>
          EdgeIQ provides AI-generated insights for informational purposes only. Always bet responsibly. Never bet more than you can afford to lose.
        </p>
      </div>
    </Modal>
  );
}