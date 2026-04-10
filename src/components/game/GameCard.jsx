/**
 * GameCard.jsx — Displays a single game with home/away teams and start time.
 * Clicking navigates to the MatchPage for that game.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './GameCard.module.css';

// Format "2024-01-15T02:00:00Z" → "7:00 PM ET"
const formatGameTime = (isoString) => {
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch { return '—'; }
};

export default function GameCard({ game, sport }) {
  const isLive = game.status === 'live';

  return (
    <Link to={`/match/${sport}/${game.oddsEventId}`} className={styles.card}>
      {/* Live indicator */}
      {isLive && (
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          LIVE
        </div>
      )}

      {/* Teams */}
      <div className={styles.teams}>
        <div className={styles.team}>
          <div className={styles.teamAbbr}>{game.awayTeam?.abbreviation || '—'}</div>
          <div className={styles.teamName}>{game.awayTeam?.name}</div>
        </div>
        <div className={styles.versus}>
          <span className={styles.versusText}>VS</span>
          <span className={styles.gameTime}>{formatGameTime(game.startTime)}</span>
        </div>
        <div className={`${styles.team} ${styles.teamRight}`}>
          <div className={styles.teamAbbr}>{game.homeTeam?.abbreviation || '—'}</div>
          <div className={styles.teamName}>{game.homeTeam?.name}</div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {game.hasProps ? (
          <span className={styles.propsAvailable}>
            <span className={styles.propsDot} />
            Props available
          </span>
        ) : (
          <span className={styles.noProps}>Lines pending</span>
        )}
        <span className={styles.cta}>View insights →</span>
      </div>
    </Link>
  );
}