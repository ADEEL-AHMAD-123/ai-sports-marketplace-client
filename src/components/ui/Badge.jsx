// components/ui/Badge.jsx
import React from 'react';
import styles from './Badge.module.scss';

/**
 * Badge for status labels, tags, confidence indicators.
 * @prop variant 'accent' | 'danger' | 'warning' | 'info' | 'neutral' | 'over' | 'under'
 */
export function Badge({ children, variant = 'neutral', dot = false, className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}