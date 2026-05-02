/**
 * SportTabs.jsx
 */
import React from 'react';
import styles from './SportTabs.module.css';

const SPORTS = [
  { key: 'nba',    label: 'NBA',    emoji: '🏀' },
  { key: 'nfl',    label: 'NFL',    emoji: '🏈', comingSoon: true },
  { key: 'mlb',    label: 'MLB',    emoji: '⚾' },
  { key: 'nhl',    label: 'NHL',    emoji: '🏒' },
  { key: 'soccer', label: 'Soccer', emoji: '⚽', comingSoon: true },
];

export default function SportTabs({ activeSport, onChange }) {
  return (
    <div className={styles.tabs}>
      {SPORTS.map((sport) => (
        <button
          key={sport.key}
          className={`${styles.tab} ${activeSport === sport.key ? styles.active : ''} ${sport.comingSoon ? styles.soon : ''}`}
          onClick={() => !sport.comingSoon && onChange(sport.key)}
          disabled={sport.comingSoon}
          title={sport.comingSoon ? 'Coming soon' : sport.label}
        >
          <span className={styles.emoji}>{sport.emoji}</span>
          <span className={styles.label}>{sport.label}</span>
          {sport.comingSoon && <span className={styles.soonBadge}>Soon</span>}
        </button>
      ))}
    </div>
  );
}