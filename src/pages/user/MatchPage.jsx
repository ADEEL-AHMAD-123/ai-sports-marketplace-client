// src/pages/user/MatchPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useProps } from '@/hooks/useOdds';
import { setActiveFilter, selectActiveFilter, resetFilter } from '@/store/slices/uiSlice';
import PropCard from '@/components/insight/PropCard';
import { PropCardSkeleton } from '@/components/ui/Skeleton';
import { getFilterDefsForSport, getSportConfig } from '@/config/sportConfig';
import styles from './MatchPage.module.scss';

const BackIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;

// Team logo with initials fallback
function TeamLogo({ logoUrl, name, size = 48 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  if (!logoUrl || err) {
    return (
      <div className={styles.logoFallback} style={{ width: size, height: size, fontSize: Math.round(size * 0.30) }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={name}
      width={size}
      height={size}
      className={styles.logoImg}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
    />
  );
}

// Compute a 3-letter abbreviation as a fallback when the prop didn't include one
const deriveAbbr = (name) => {
  if (!name) return null;
  const words = String(name).split(' ').filter(Boolean);
  if (!words.length) return null;
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  // Strip the city, take last word's first 3 letters (e.g. "Maple Leafs" → "MAP")
  const last = words[words.length - 1];
  return last.slice(0, 3).toUpperCase();
};

const fmtTimeET = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
      timeZone: 'America/New_York', timeZoneName: 'short',
    });
  } catch { return null; }
};

const fmtDateShort = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      timeZone: 'America/New_York',
    });
  } catch { return null; }
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const card    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function MatchPage() {
  const { sport, eventId } = useParams();
  const dispatch     = useDispatch();
  const activeFilter = useSelector(selectActiveFilter);
  const sportCfg     = getSportConfig(sport);
  const FILTERS      = getFilterDefsForSport(sport);

  useEffect(() => { dispatch(resetFilter()); }, [eventId]);

  const { props, isLoading, error, refresh, refreshFromBookies, isRefreshing } = useProps(sport, eventId);

  const firstProp = props?.[0];
  useEffect(() => {
    const away = firstProp?.awayTeam;
    const home = firstProp?.homeTeam;
    document.title = (away && home)
      ? `${away} vs ${home} · Props | EdgeIQ`
      : `${sportCfg.label} Player Props | EdgeIQ`;
    return () => { document.title = 'EdgeIQ — AI Sports Insights'; };
  }, [firstProp, sportCfg]);

  const counts = {
    all:            props.length,
    highConfidence: props.filter(p => p.isHighConfidence).length,
    bestValue:      props.filter(p => p.isBestValue).length,
  };

  const visible = activeFilter === 'all' ? props
    : activeFilter === 'highConfidence' ? props.filter(p => p.isHighConfidence)
    : props.filter(p => p.isBestValue);

  const gameTime  = firstProp?.gameStartTime ? fmtTimeET(firstProp.gameStartTime) : null;
  const gameDate  = firstProp?.gameStartTime ? fmtDateShort(firstProp.gameStartTime) : null;
  const awayTeam  = firstProp?.awayTeam || null;
  const homeTeam  = firstProp?.homeTeam || null;
  const awayLogo  = firstProp?.awayTeamLogo || null;
  const homeLogo  = firstProp?.homeTeamLogo || null;
  const awayAbbr  = firstProp?.awayTeamAbbr || deriveAbbr(awayTeam);
  const homeAbbr  = firstProp?.homeTeamAbbr || deriveAbbr(homeTeam);
  const hasContext = awayTeam && homeTeam;

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.container}>

          {/* Back nav */}
          <Link to="/" className={styles.back}>
            <BackIcon />
            <span>Back to Games</span>
          </Link>

          {/* ── Page header ────────────────────────────────────────── */}
          <header className={styles.header}>
            <div className={styles.eyebrow}>
              <span className={styles.sportTag}>{sport?.toUpperCase()}</span>
              <span className={styles.eyebrowDot}>·</span>
              <span className={styles.eyebrowText}>Player Props</span>
            </div>

            {hasContext ? (
              <div className={styles.matchup}>
                {/* Away */}
                <div className={styles.team}>
                  <TeamLogo logoUrl={awayLogo} name={awayTeam} size={52} />
                  <div className={styles.teamLabel}>
                    <span className={styles.teamAbbr}>{awayAbbr || '—'}</span>
                    <span className={styles.teamName}>{awayTeam}</span>
                  </div>
                </div>

                {/* Center */}
                <div className={styles.center}>
                  <span className={styles.vsText}>VS</span>
                  {gameDate && <span className={styles.dateText}>{gameDate}</span>}
                  {gameTime && <span className={styles.timeText}>{gameTime}</span>}
                </div>

                {/* Home */}
                <div className={`${styles.team} ${styles.teamRight}`}>
                  <div className={`${styles.teamLabel} ${styles.teamLabelRight}`}>
                    <span className={styles.teamAbbr}>{homeAbbr || '—'}</span>
                    <span className={styles.teamName}>{homeTeam}</span>
                  </div>
                  <TeamLogo logoUrl={homeLogo} name={homeTeam} size={52} />
                </div>
              </div>
            ) : (
              <h1 className={styles.fallbackTitle}>{sportCfg.label} Player Props</h1>
            )}

            <div className={styles.headerFooter}>
              <span className={styles.count}>
                {props.length} {props.length === 1 ? 'prop' : 'props'}
                {counts.highConfidence > 0 && (
                  <>
                    <span className={styles.metaDot}>·</span>
                    <span className={styles.countAccent}>{counts.highConfidence} HC</span>
                  </>
                )}
              </span>
              <button
                className={styles.refreshBtn}
                onClick={async () => {
                  const loadingToast = toast.loading('Fetching live odds from bookies...');
                  const result = await refreshFromBookies();
                  toast.dismiss(loadingToast);
                  if (result.success) {
                    toast.success(`Updated ${result.count} props from bookies`);
                  } else {
                    toast.error(result.message);
                  }
                }}
                disabled={isRefreshing}
                title="Refresh props from live bookies"
              >
                <RefreshIcon />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </header>

          {/* ── Filter bar ──────────────────────────────────────────── */}
          <nav className={styles.filterBar} aria-label="Filter props">
            {FILTERS.map(({ key, label, icon }) => {
              const count  = counts[key];
              const active = activeFilter === key;
              return (
                <button
                  key={key}
                  className={`${styles.filter} ${active ? styles.filterOn : ''}`}
                  onClick={() => dispatch(setActiveFilter(key))}
                  aria-pressed={active}
                >
                  <span className={styles.filterIcon}>{icon}</span>
                  <span className={styles.filterLabel}>{label}</span>
                  {!isLoading && count > 0 && (
                    <span className={`${styles.filterCount} ${active ? styles.filterCountOn : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <span className={styles.filterNote}>1 credit per insight · auto-refund if AI fails</span>
          </nav>

          {isLoading && (
            <div className={styles.grid}>
              {[...Array(6)].map((_, i) => <PropCardSkeleton key={i} />)}
            </div>
          )}

          {error && !isLoading && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Could not load props</p>
              <p className={styles.emptySub}>Check your connection and try again.</p>
              <button className={styles.emptyBtn} onClick={refresh}>Try again</button>
            </div>
          )}

          {!isLoading && !error && visible.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>
                {activeFilter !== 'all'
                  ? `No ${activeFilter === 'highConfidence' ? 'High Confidence' : 'Best Value'} props`
                  : 'No props yet'}
              </p>
              <p className={styles.emptySub}>
                {activeFilter !== 'all'
                  ? `${counts.all} props available in All Props view`
                  : 'Markets update during the day. Check back shortly.'}
              </p>
              {activeFilter !== 'all' && (
                <button className={styles.emptyBtn} onClick={() => dispatch(resetFilter())}>
                  View all {counts.all} props
                </button>
              )}
            </div>
          )}

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
      </section>
    </div>
  );
}
