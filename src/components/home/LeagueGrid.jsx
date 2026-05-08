// src/components/home/LeagueGrid.jsx
// Sport selector — unified horizontal pill bar (works on all viewports).
// Cards on desktop felt over-built for what is actually a one-shot filter
// decision. Pills match what every major sportsbook uses + free up the
// vertical real estate for the actual games slate below.

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { selectActiveSport, setActiveSport } from '@/store/slices/uiSlice';
import { getAllSports, getLeagueLogoUrl } from '@/config/sportConfig';
import styles from './LeagueGrid.module.scss';

const SPORTS = getAllSports();

function LeagueLogo({ sport, size = 24 }) {
  const [err, setErr] = useState(false);
  const url = getLeagueLogoUrl(sport.key);
  if (err || !url) {
    return (
      <span className={styles.logoFallback} style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
        {sport.label?.slice(0, 1) || '?'}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={`${sport.label} league logo`}
      width={size}
      height={size}
      className={styles.logoImg}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function LeagueGrid() {
  const dispatch    = useDispatch();
  const activeSport = useSelector(selectActiveSport);
  const inactiveCount = SPORTS.filter(s => !s.isActive).length;

  return (
    <section className={styles.section}>
      <div className={styles.container}>

        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>Select League</h2>
            <p className={styles.sub}>
              Choose a sport to load today's games and AI scouting reports
            </p>
          </div>
          {inactiveCount > 0 && (
            <span className={styles.comingSoon}>
              {inactiveCount} more launching soon
            </span>
          )}
        </header>

        {/* Unified horizontal pill bar — scrollable on narrow screens */}
        <nav className={styles.bar} aria-label="Select sport">
          <div className={styles.barTrack}>
            {SPORTS.map((s, i) => {
              const active = activeSport === s.key;
              return (
                <motion.button
                  key={s.key}
                  type="button"
                  className={[
                    styles.pill,
                    active ? styles.pillActive : '',
                    !s.isActive ? styles.pillDisabled : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => s.isActive && dispatch(setActiveSport(s.key))}
                  disabled={!s.isActive}
                  aria-pressed={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <span className={styles.pillLogo}>
                    <LeagueLogo sport={s} size={22} />
                  </span>
                  <span className={styles.pillBody}>
                    <span className={styles.pillName}>{s.label}</span>
                    {s.isActive ? (
                      <span className={`${styles.pillStatus} ${styles.pillLive}`}>
                        <span className={styles.pillDot} />Live
                      </span>
                    ) : (
                      <span className={`${styles.pillStatus} ${styles.pillSoon}`}>Soon</span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
