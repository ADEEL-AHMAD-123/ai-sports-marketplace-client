// src/components/home/LiveSlate.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useOdds } from '@/hooks/useOdds';
import { selectActiveSport } from '@/store/slices/uiSlice';
import styles from './LiveSlate.module.scss';
import { GameRowSkeleton } from '@/components/ui/Skeleton';

// Team logo — backend is source of truth (homeTeam.logoUrl / awayTeam.logoUrl)
function TeamLogo({ logoUrl, name, size = 48 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();

  if (!logoUrl || err) {
    return (
      <div className={styles.logoFallback} style={{ width: size, height: size, fontSize: size * 0.28 }}>
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

// GameBadge — backend provides topConfidence, topEdge, propCount, hasProps
// Gracefully falls back through the chain if fields are missing
function GameBadge({ game }) {
  if (game.status === 'live') {
    return (
      <span className={styles.badgeLive}>
        <span className={styles.livePulse} />
        LIVE
      </span>
    );
  }

  // topConfidence is the highest confidenceScore among this game's HC-tagged props
  if (game.topConfidence && game.topConfidence >= 57) {
    return (
      <span className={styles.badgeConf}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        {game.topConfidence}% Conf
      </span>
    );
  }

  // topEdge is the highest |edgePercentage| among this game's BV-tagged props
  if (game.topEdge && game.topEdge >= 15) {
    return (
      <span className={styles.badgeEdge}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        +{game.topEdge}% Edge
      </span>
    );
  }

  // hasProps is set by propWatcher when at least one upsert succeeds
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

  if (minsFromNow > 0 && minsFromNow < 60) {
    return <span className={styles.timeTagSoon}>Starts in {minsFromNow}m</span>;
  }

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

export default function LiveSlate() {
  const activeSport = useSelector(selectActiveSport);
  const { games, isLoading, error, refresh } = useOdds();

  // Only show games that have props available
  const gamesWithProps = games.filter((g) => Number(g.propCount || 0) > 0 || g.hasProps);

  const sortedGames = [...gamesWithProps].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const liveCount = gamesWithProps.filter(g => g.status === 'live').length;

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
            <span className={styles.count}>{gamesWithProps.length} {gamesWithProps.length === 1 ? 'game' : 'games'}</span>
          )}
        </div>

        {isLoading && (
          <div className={styles.list}>
            {[...Array(3)].map((_, i) => <GameRowSkeleton key={i} />)}
          </div>
        )}

        {error && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Backend offline</p>
            <p className={styles.emptySub}>Start your server at localhost:5000 to load live games.</p>
            <button className={styles.retryBtn} onClick={refresh}>Retry</button>
          </div>
        )}

        {!isLoading && !error && gamesWithProps.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No {activeSport.toUpperCase()} games with props right now</p>
            <p className={styles.emptySub}>
              Markets update during the day. Check back shortly or tap retry.
            </p>
            <button className={styles.retryBtn} onClick={refresh}>Retry</button>
          </div>
        )}

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
                    <div className={styles.rowTop}>
                      {/* Away team */}
                      <div className={styles.team}>
                        <TeamLogo
                          logoUrl={game.awayTeam?.logoUrl || game.awayTeam?.logo}
                          name={game.awayTeam?.name}
                          size={48}
                        />
                        <div className={styles.teamInfo}>
                          <p className={styles.teamAbbr}>{game.awayTeam?.abbreviation || '—'}</p>
                          <p className={styles.teamName}>{game.awayTeam?.name}</p>
                        </div>
                      </div>

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
                        <TeamLogo
                          logoUrl={game.homeTeam?.logoUrl || game.homeTeam?.logo}
                          name={game.homeTeam?.name}
                          size={48}
                        />
                      </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.market}>
                      {game.hasProps ? (
                        <>
                          <p className={styles.marketLbl}>
                            {game.propCount > 0 ? `${game.propCount} Props Available` : 'Props Available'}
                          </p>
                          <p className={styles.marketCta}>View Scouting Report</p>
                        </>
                      ) : (
                        <p className={styles.marketPending}>Lines pending</p>
                      )}
                    </div>

                    <div className={styles.right}>
                      <GameBadge game={game} />
                      <span className={styles.arrow}><ArrR /></span>
                    </div>

                    {/* Mobile bottom row */}
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