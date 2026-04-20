// src/components/home/LeagueGrid.jsx
// Sport selector — uses sportConfig.js as single source of truth.
// No sport-specific logic lives here — just reads the config and renders.

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { selectActiveSport, setActiveSport } from '@/store/slices/uiSlice';
import { getAllSports, getLeagueLogoUrl } from '@/config/sportConfig';
import styles from './LeagueGrid.module.scss';

// Sport data comes entirely from sportConfig — nothing hardcoded here
const SPORTS = getAllSports();

function LeagueLogo({ sport }) {
  const [err, setErr] = useState(false);
  const url = getLeagueLogoUrl(sport.key);

  if (err || !url) {
    return <div className={styles.logoFallback}>{sport.label}</div>;
  }
  return (
    <img
      src={url}
      alt={`${sport.label} league logo`}
      className={styles.logoImg}
      onError={() => setErr(true)}
    />
  );
}

export default function LeagueGrid() {
  const dispatch    = useDispatch();
  const activeSport = useSelector(selectActiveSport);

  return (
    <section className={styles.section}>
      <div className={styles.container}>

        {/* Desktop header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Select League</h2>
            <p className={styles.sub}>Choose a sport to load today's games and AI scouting reports</p>
          </div>
          <span className={styles.comingSoon}>
            {SPORTS.filter(s => !s.isActive).length} more leagues launching soon
          </span>
        </div>

        {/* Desktop grid */}
        <div className={styles.grid}>
          {SPORTS.map((s, i) => (
            <motion.button
              key={s.key}
              className={[
                styles.card,
                activeSport === s.key ? styles.cardActive : '',
                !s.isActive ? styles.cardDisabled : '',
              ].join(' ')}
              onClick={() => s.isActive && dispatch(setActiveSport(s.key))}
              disabled={!s.isActive}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.32 }}
              whileHover={s.isActive ? { y: -4, transition: { duration: 0.12 } } : {}}
            >
              <div className={styles.logoWrap}>
                <LeagueLogo sport={s} />
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{s.label}</span>
                <span className={styles.full}>{s.fullName}</span>
                <span className={styles.region}>{s.region}</span>
              </div>
              {s.isActive
                ? <span className={styles.liveBadge}><span className={styles.liveDot} />Live</span>
                : <span className={styles.soonBadge}>Soon</span>
              }
              {activeSport === s.key && <div className={styles.activeLine} />}
            </motion.button>
          ))}
        </div>

        {/* Mobile tabs */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {SPORTS.map((s) => (
              <button
                key={s.key}
                className={[
                  styles.tab,
                  activeSport === s.key ? styles.tabActive : '',
                  !s.isActive ? styles.tabDisabled : '',
                ].join(' ')}
                onClick={() => s.isActive && dispatch(setActiveSport(s.key))}
                disabled={!s.isActive}
              >
                <div className={styles.tabLogo}>
                  <LeagueLogo sport={s} />
                </div>
                <span className={styles.tabName}>{s.label}</span>
                {!s.isActive && <span className={styles.tabSoon}>Soon</span>}
                {s.isActive && activeSport !== s.key && <span className={styles.tabLive}>Live</span>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}