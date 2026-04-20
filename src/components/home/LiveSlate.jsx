// src/components/home/LiveSlate.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useOdds } from '@/hooks/useOdds';
import { selectActiveSport } from '@/store/slices/uiSlice';
import { getTeamLogoUrl } from '@/config/sportConfig';
import styles from './LiveSlate.module.scss';
import { GameRowSkeleton } from '@/components/ui/Skeleton';

// ── Team logo — sport-agnostic via sportConfig ────────────────────────────────
function TeamLogo({ apiId, name, sport, size = 48 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const src = getTeamLogoUrl(sport, apiId);

  if (!apiId || !src || err) {
    return (
      <div className={styles.logoFallback} style={{ width: size, height: size, fontSize: size * 0.28 }}>
        {initials}
      </div>
    );
  }
  return <img src={src} alt={name} width={size} height={size} className={styles.logoImg} onError={() => setErr(true)} />;
}

// ── Right-side badge — shows real backend data ────────────────
function GameBadge({ game }) {
  if (game.status === 'live') {
    return (
      <span className={styles.badgeLive}>
        <span className={styles.livePulse} />
        LIVE
      </span>
    );
  }
  if (game.topConfidence) {
    return (
      <span className={styles.badgeConf}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        {game.topConfidence}% Conf
      </span>
    );
  }
  if (game.topEdge) {
    return (
      <span className={styles.badgeEdge}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        +{game.topEdge}% Edge
      </span>
    );
  }
  if (game.hasProps) {
    return (
      <span className={styles.badgeReady}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        AI Ready
      </span>
    );
  }
  return <span className={styles.badgePending}>Lines Pending</span>;
}

// ── Time display ──────────────────────────────────────────────
function GameTime({ game }) {
  if (game.status === 'live') {
    return (
      <span className={styles.timeTagLive}>
        <span className={styles.liveDot} />
        IN PROGRESS
      </span>
    );
  }

  const start = new Date(game.startTime);
  const minsFromNow = Math.round((start - Date.now()) / 60000);

  // < 60 min away — show countdown
  if (minsFromNow > 0 && minsFromNow < 60) {
    return <span className={styles.timeTagSoon}>Starts in {minsFromNow}m</span>;
  }

  // < 24h away — show time only
  if (minsFromNow >= 0 && minsFromNow < 1440) {
    try {
      return (
        <div className={styles.timeBlock}>
          <span className={styles.timeDate}>
            {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className={styles.timeTag}>
            {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' })}
          </span>
        </div>
      );
    } catch { return <span className={styles.timeTag}>TBD</span>; }
  }

  // > 24h away — show date + time
  try {
    return (
      <div className={styles.timeBlock}>
        <span className={styles.timeDate}>
          {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className={styles.timeTag}>
          {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' })}
        </span>
      </div>
    );
  } catch { return <span className={styles.timeTag}>TBD</span>; }
}

const ArrR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ── LiveSlate ─────────────────────────────────────────────────
export default function LiveSlate() {
  const activeSport = useSelector(selectActiveSport);
  const { games, isLoading, error, refresh } = useOdds();

  // Sort: LIVE games first, then by start time ascending
  const sortedGames = [...games].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const liveCount = games.filter(g => g.status === 'live').length;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {liveCount > 0 && <span className={styles.liveIndicator}><span className={styles.liveDot} />{liveCount} Live</span>}
              Today's Slate
              <span className={styles.sportTag}>{activeSport.toUpperCase()}</span>
            </h2>
            <p className={styles.sub}>Click any game to view props and unlock AI scouting reports</p>
          </div>
          {!isLoading && !error && (
            <span className={styles.count}>{games.length} {games.length === 1 ? 'game' : 'games'}</span>
          )}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className={styles.list}>
            {[...Array(3)].map((_, i) => <GameRowSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Backend offline</p>
            <p className={styles.emptySub}>Start your server at localhost:5000 to load live games.</p>
            <button className={styles.retryBtn} onClick={refresh}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && games.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No upcoming {activeSport.toUpperCase()} games</p>
            <p className={styles.emptySub}>
              Games appear here when the morning scraper runs (8 AM daily).
              Check back later or trigger it manually from the admin panel.
            </p>
          </div>
        )}

        {/* Game rows */}
        {!isLoading && !error && sortedGames.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSport}
              className={styles.list}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {sortedGames.map((game, i) => (
                <motion.div
                  key={game._id || game.oddsEventId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.28 }}
                >
                  <Link
                    to={`/match/${activeSport}/${game.oddsEventId}`}
                    className={`${styles.row} ${game.status === 'live' ? styles.rowLive : ''}`}
                  >
                    {/* ── Top row: both teams + time (always visible) ── */}
                    <div className={styles.rowTop}>
                      {/* Away team */}
                      <div className={styles.team}>
                        <TeamLogo apiId={game.awayTeam?.apiSportsId} name={game.awayTeam?.name} sport={activeSport} size={48} />
                        <div className={styles.teamInfo}>
                          <p className={styles.teamAbbr}>{game.awayTeam?.abbreviation || '—'}</p>
                          <p className={styles.teamName}>{game.awayTeam?.name}</p>
                        </div>
                      </div>

                      {/* Center: time */}
                      <div className={styles.center}>
                        <GameTime game={game} />
                        <span className={styles.vsText}>VS</span>
                      </div>

                      {/* Home team */}
                      <div className={`${styles.team} ${styles.teamRight}`}>
                        <div className={`${styles.teamInfo} ${styles.teamInfoRight}`}>
                          <p className={styles.teamAbbr}>{game.homeTeam?.abbreviation || '—'}</p>
                          <p className={styles.teamName}>{game.homeTeam?.name}</p>
                        </div>
                        <TeamLogo apiId={game.homeTeam?.apiSportsId} name={game.homeTeam?.name} sport={activeSport} size={48} />
                      </div>
                    </div>

                    {/* ── Divider (desktop only) ── */}
                    <div className={styles.divider} />

                    {/* ── Market info (desktop only) ── */}
                    <div className={styles.market}>
                      {game.hasProps && game.propCount > 0 ? (
                        <>
                          <p className={styles.marketLbl}>{game.propCount} Props Available</p>
                          <p className={styles.marketCta}>View Scouting Report</p>
                        </>
                      ) : game.hasProps ? (
                        <>
                          <p className={styles.marketLbl}>Props Available</p>
                          <p className={styles.marketCta}>View Scouting Report</p>
                        </>
                      ) : (
                        <p className={styles.marketPending}>Lines pending</p>
                      )}
                    </div>

                    {/* ── Badge + arrow (desktop only) ── */}
                    <div className={styles.right}>
                      <GameBadge game={game} />
                      <span className={styles.arrow}><ArrR /></span>
                    </div>

                    {/* ── Bottom row: badge + CTA (mobile only) ── */}
                    <div className={styles.rowBottom}>
                      <GameBadge game={game} />
                      <span className={styles.marketMobile}>
                        {game.hasProps
                          ? `${game.propCount > 0 ? game.propCount + ' Props' : 'Props'} · View Report →`
                          : 'Lines pending'}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}