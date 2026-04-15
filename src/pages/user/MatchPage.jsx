// src/pages/user/MatchPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useProps } from '@/hooks/useOdds';
import { setActiveFilter, selectActiveFilter, resetFilter } from '@/store/slices/uiSlice';
import PropCard from '@/components/insight/PropCard';
import { PropCardSkeleton } from '@/components/ui/Skeleton';
import styles from './MatchPage.module.scss';

const BackIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;

const FILTERS = [
  { key: 'all',            label: 'All Props',       hint: '',                  icon: '≡'  },
  { key: 'highConfidence', label: 'High Confidence', hint: '8/10+ hit rate',    icon: '↗'  },
  { key: 'bestValue',      label: 'Best Value',      hint: '15%+ edge on line', icon: '⚡' },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const card    = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function MatchPage() {
  const { sport, eventId } = useParams();
  const dispatch     = useDispatch();
  const activeFilter = useSelector(selectActiveFilter);

  // Always reset to 'all' on mount — prevents stale filter from previous session
  useEffect(() => { dispatch(resetFilter()); }, [eventId]);

  const { props, isLoading, error, refresh } = useProps(sport, eventId);

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

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Back nav */}
        <Link to="/" className={styles.back}><BackIcon />Back to Games</Link>

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

        {/* Props grid */}
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