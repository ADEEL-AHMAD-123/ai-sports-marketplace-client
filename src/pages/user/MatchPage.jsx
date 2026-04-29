// src/pages/user/MatchPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useProps } from '@/hooks/useOdds';
import { setActiveFilter, selectActiveFilter, resetFilter } from '@/store/slices/uiSlice';
import PropCard from '@/components/insight/PropCard';
import { PropCardSkeleton } from '@/components/ui/Skeleton';
import { getFilterDefsForSport, getSportConfig } from '@/config/sportConfig';
import styles from './MatchPage.module.scss';

const BackIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;

// Format game time as ET — sports bettors always want ET
const fmtTimeET = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    });
  } catch { return null; }
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const card    = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function MatchPage() {
  const { sport, eventId } = useParams();
  const dispatch     = useDispatch();
  const activeFilter = useSelector(selectActiveFilter);
  const sportCfg     = getSportConfig(sport);
  const FILTERS      = getFilterDefsForSport(sport);

  // Always reset to 'all' on mount
  useEffect(() => { dispatch(resetFilter()); }, [eventId]);

  const { props, isLoading, error, refresh } = useProps(sport, eventId);

  // Dynamic page title
  const firstProp = props?.[0];
  useEffect(() => {
    const away = firstProp?.awayTeam;
    const home = firstProp?.homeTeam;
    if (away && home) {
      document.title = `${away} vs ${home} · Props | EdgeIQ`;
    } else {
      document.title = `${sportCfg.label} Player Props | EdgeIQ`;
    }
    return () => { document.title = 'EdgeIQ — AI Sports Insights'; };
  }, [firstProp, sportCfg]);

  // Count per filter for badges
  const counts = {
    all:            props.length,
    highConfidence: props.filter(p => p.isHighConfidence).length,
    bestValue:      props.filter(p => p.isBestValue).length,
  };

  // Client-side filter for instant response
  const visible = activeFilter === 'all' ? props
    : activeFilter === 'highConfidence' ? props.filter(p => p.isHighConfidence)
    : props.filter(p => p.isBestValue);

  // Extract game context from first prop (all props share the same game)
  // gameInfo comes from the prop or we can infer from the URL eventId
  const gameTime   = firstProp?.gameStartTime ? fmtTimeET(firstProp.gameStartTime) : null;
  const awayTeam   = firstProp?.awayTeam || null;
  const homeTeam   = firstProp?.homeTeam || null;
  const hasContext = awayTeam && homeTeam;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Back nav */}
        <Link to="/" className={styles.back}><BackIcon />Back to Games</Link>

        {/* Game context strip — shows which game you're looking at */}
        {hasContext && (
          <div className={styles.gameContext}>
            <span className={styles.gameTeams}>
              <strong>{awayTeam}</strong>
              <span className={styles.gameVs}>vs</span>
              <strong>{homeTeam}</strong>
            </span>
            {gameTime && (
              <span className={styles.gameTime}>{gameTime}</span>
            )}
            <span className={styles.gameSport}>{sport?.toUpperCase()}</span>
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Player Props</h1>
            <p className={styles.sub}>Unlock AI scouting reports — 1 credit per insight</p>
          </div>
          <button className={styles.refreshBtn} onClick={refresh}>
            <RefreshIcon />Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          {FILTERS.map(({ key, label, hint, icon }) => {
            const count  = counts[key];
            const active = activeFilter === key;
            return (
              <button
                key={key}
                className={`${styles.filter} ${active ? styles.filterOn : ''}`}
                onClick={() => dispatch(setActiveFilter(key))}
              >
                <span className={styles.filterIcon}>{icon}</span>
                <span className={styles.filterLabel}>{label}</span>
                {hint && <span className={styles.filterHint}>{hint}</span>}
                {!isLoading && count > 0 && (
                  <span className={`${styles.filterCount} ${active ? styles.filterCountOn : ''}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Info strip */}
        <div className={styles.notice}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          1 credit per insight · 3 free credits on signup · Auto-refund if AI fails
        </div>

        {/* Skeleton loading */}
        {isLoading && (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => <PropCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>⚡</p>
            <p className={styles.emptyTitle}>Could not load props</p>
            <p className={styles.emptySub}>Check your server is running.</p>
            <button className={styles.emptyBtn} onClick={refresh}>Try again</button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && visible.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>{activeFilter !== 'all' ? '🔍' : '⏳'}</p>
            <p className={styles.emptyTitle}>
              {activeFilter !== 'all'
                ? `No ${activeFilter === 'highConfidence' ? 'High Confidence' : 'Best Value'} props`
                : 'No props yet'}
            </p>
            <p className={styles.emptySub}>
              {activeFilter !== 'all'
                ? `${counts.all} props available in All Props view`
                : 'Props are fetched every 30 minutes.'}
            </p>
            {activeFilter !== 'all' && (
              <button className={styles.emptyBtn} onClick={() => dispatch(resetFilter())}>
                View all {counts.all} props
              </button>
            )}
          </div>
        )}

        {/* Props grid — 2 columns max for readability */}
        {!isLoading && !error && visible.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${eventId}-${activeFilter}`}
              className={styles.grid}
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {visible.map(p => (
                <motion.div key={`${p.playerName}-${p.statType}`} variants={card}>
                  <PropCard prop={p} sport={sport} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}