// src/pages/user/MatchPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useProps } from '@/hooks/useOdds';
import { setActiveFilter, selectActiveFilter, resetFilter } from '@/store/slices/uiSlice';
import PropCard from '@/components/insight/PropCard';
import { PropCardSkeleton } from '@/components/ui/Skeleton';
import { getFilterDefsForSport, getSportConfig } from '@/config/sportConfig';
import useSEO from '@/hooks/useSEO';
import styles from './MatchPage.module.scss';

const BackIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;

// Team logo with initials fallback.
// Prefer the passed-in abbreviation over derived initials so the badge
// always matches the big text label next to it (Atlanta United FC's badge
// was "AUF" while the label was "ATL" — same team, two different codes).
function TeamLogo({ logoUrl, name, abbr, size = 48 }) {
  const [err, setErr] = useState(false);
  const fallbackFromName = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const initials = (abbr && String(abbr).trim()) || fallbackFromName;
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

// Render in the viewer's local browser timezone. See utils/formatters.js
// for the app-wide rendering policy. (Function name kept for git-blame
// continuity; it no longer pins to ET.)
const fmtTimeET = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
  } catch { return null; }
};

const fmtDateShort = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
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

  const { props, isLoading, error, refresh } = useProps(sport, eventId);

  const firstProp = props?.[0];
  useEffect(() => {
    const away = firstProp?.awayTeam;
    const home = firstProp?.homeTeam;
    document.title = (away && home)
      ? `${away} vs ${home} · Props | EdgeAI`
      : `${sportCfg.label} Player Props | EdgeAI`;
    return () => { document.title = 'EdgeAI — AI-Powered Sports Betting Scouting'; };
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

  // Per-match SEO — a real matchup like "Lakers vs. Warriors — NBA Player
  // Props" ranks for the specific game long-tail. Falls back to a generic
  // sport title while props are still loading.
  const matchTitle = hasContext
    ? `${awayTeam} vs ${homeTeam} — ${sportCfg.label} Player Props & AI Scouting | EdgeAI`
    : `${sportCfg.label} Player Props | EdgeAI`;
  const matchDesc = hasContext
    ? `AI-powered scouting reports on every player prop for ${awayTeam} vs ${homeTeam}. Grounded in 15+ games of stats, matchup analysis, and live sportsbook line comparison.`
    : `AI-powered scouting reports on ${sportCfg.label} player props, grounded in stats and matchup analysis.`;
  const matchCanonical = `https://edgeai.bet/match/${sport}/${eventId}`;
  const matchJsonLd = hasContext ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'EdgeAI',            item: 'https://edgeai.bet/' },
          { '@type': 'ListItem', position: 2, name: sportCfg.label,      item: `https://edgeai.bet/sports/${sport}` },
          { '@type': 'ListItem', position: 3, name: `${awayTeam} vs ${homeTeam}`, item: matchCanonical },
        ],
      },
      {
        '@type': 'SportsEvent',
        name: `${awayTeam} vs ${homeTeam}`,
        sport: sportCfg.label,
        startDate: firstProp?.gameStartTime || undefined,
        competitor: [
          { '@type': 'SportsTeam', name: awayTeam, ...(awayAbbr ? { alternateName: awayAbbr } : {}) },
          { '@type': 'SportsTeam', name: homeTeam, ...(homeAbbr ? { alternateName: homeAbbr } : {}) },
        ],
        url: matchCanonical,
      },
    ],
  } : null;
  useSEO({
    title:       matchTitle,
    description: matchDesc,
    canonical:   matchCanonical,
    jsonLd:      matchJsonLd,
  });

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
                  <TeamLogo logoUrl={awayLogo} name={awayTeam} abbr={awayAbbr} size={52} />
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
                  <TeamLogo logoUrl={homeLogo} name={homeTeam} abbr={homeAbbr} size={52} />
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
