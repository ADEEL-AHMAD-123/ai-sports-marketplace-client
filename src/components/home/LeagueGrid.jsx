// src/components/home/LeagueGrid.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { selectActiveSport, setActiveSport } from '@/store/slices/uiSlice';
import styles from './LeagueGrid.module.scss';

// ── Official league logos via API-Sports CDN ──────────────────
const LEAGUE_LOGOS = {
  nba:    'https://media.api-sports.io/basketball/leagues/12.png',
  nfl:    'https://media.api-sports.io/american-football/leagues/1.png',
  mlb:    'https://media.api-sports.io/baseball/leagues/1.png',
  nhl:    'https://media.api-sports.io/hockey/leagues/57.png',
  soccer: 'https://media.api-sports.io/football/leagues/39.png',
};

const SPORTS = [
  { key: 'nba',    name: 'NBA',    full: 'Basketball',        region: 'North America', active: true  },
  { key: 'nfl',    name: 'NFL',    full: 'American Football', region: 'North America', active: false },
  { key: 'mlb',    name: 'MLB',    full: 'Baseball',          region: 'North America', active: false },
  { key: 'nhl',    name: 'NHL',    full: 'Ice Hockey',        region: 'North America', active: false },
  { key: 'soccer', name: 'Soccer', full: 'Premier League',    region: 'Global',        active: false },
];

function LeagueLogo({ sport }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={styles.logoFallback}>{sport.toUpperCase().slice(0, 2)}</div>;
  const label = SPORTS.find((s) => s.key === sport)?.name || sport.toUpperCase();
  return (
    <img
      src={LEAGUE_LOGOS[sport]}
      alt={`${label} league logo`}
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
          <span className={styles.comingSoon}>4 more leagues launching soon</span>
        </div>

        {/* Desktop grid (hidden on mobile) */}
        <div className={styles.grid}>
          {SPORTS.map((s, i) => (
            <motion.button
              key={s.key}
              className={[
                styles.card,
                activeSport === s.key ? styles.cardActive : '',
                !s.active ? styles.cardDisabled : '',
              ].join(' ')}
              onClick={() => s.active && dispatch(setActiveSport(s.key))}
              disabled={!s.active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.32 }}
              whileHover={s.active ? { y: -4, transition: { duration: 0.12 } } : {}}
            >
              <div className={styles.logoWrap}>
                <LeagueLogo sport={s.key} />
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{s.name}</span>
                <span className={styles.full}>{s.full}</span>
                <span className={styles.region}>{s.region}</span>
              </div>
              {s.active
                ? <span className={styles.liveBadge}><span className={styles.liveDot} />Live</span>
                : <span className={styles.soonBadge}>Soon</span>
              }
              {activeSport === s.key && <div className={styles.activeLine} />}
            </motion.button>
          ))}
        </div>

        {/* Mobile tabs (hidden on desktop) */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {SPORTS.map((s) => (
              <button
                key={s.key}
                className={[
                  styles.tab,
                  activeSport === s.key ? styles.tabActive : '',
                  !s.active ? styles.tabDisabled : '',
                ].join(' ')}
                onClick={() => s.active && dispatch(setActiveSport(s.key))}
                disabled={!s.active}
              >
                <div className={styles.tabLogo}>
                  <LeagueLogo sport={s.key} />
                </div>
                <span className={styles.tabName}>{s.name}</span>
                {!s.active && <span className={styles.tabSoon}>Soon</span>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}