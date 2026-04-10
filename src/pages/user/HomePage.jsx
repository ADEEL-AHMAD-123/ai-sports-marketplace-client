import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { selectActiveSport, setActiveSport } from '@/store/slices/uiSlice';
import { selectIsLoggedIn } from '@/store/slices/authSlice';
import { oddsAPI } from '@/services/api';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './HomePage.module.scss';

// ── Sport SVG Icons ───────────────────────────────────────────
const SportIcon = ({ sport }) => {
  const icons = {
    nba: <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.8"/><path d="M16 3C13.5 9 13.5 23 16 29M16 3C18.5 9 18.5 23 16 29M3 16h26M4 10.5h24M4 21.5h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>,
    nfl: <svg viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="16" rx="12" ry="7.5" stroke="currentColor" strokeWidth="1.8"/><line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="13" y1="10" x2="13" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/><line x1="16" y1="8.5" x2="16" y2="23.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/><line x1="19" y1="10" x2="19" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/></svg>,
    mlb: <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.8"/><path d="M7 10c2.7 2.7 2.7 10.7 0 13M25 10c-2.7 2.7-2.7 10.7 0 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>,
    nhl: <svg viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="21" rx="11" ry="4" stroke="currentColor" strokeWidth="1.8"/><path d="M5 21V14C5 9.5 10.5 7 16 7s11 2.5 11 7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 15l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>,
    soccer: <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.8"/><polygon points="16,9 19,12 18,16 14,16 13,12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/><path d="M14 16l-4 3M18 16l4 3M10 19l1.5 4h9l1.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return icons[sport] || null;
};

// ── Arrow icon ────────────────────────────────────────────────
const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const ChevronLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

const SPORTS = [
  { key:'nba',    name:'NBA',    full:'Basketball',         active:true  },
  { key:'nfl',    name:'NFL',    full:'American Football',  active:false },
  { key:'mlb',    name:'MLB',    full:'Baseball',           active:false },
  { key:'nhl',    name:'NHL',    full:'Hockey',             active:false },
  { key:'soccer', name:'Soccer', full:'Football',           active:false },
];

// ── Confidence badge helper ────────────────────────────────────
const ConfidenceBadge = ({ score, isHighConfidence, isBestValue }) => {
  if (!score && !isHighConfidence && !isBestValue) return null;
  if (isHighConfidence) return (
    <span className={styles.badgeHigh}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      {score}% Confidence
    </span>
  );
  if (isBestValue) return (
    <span className={styles.badgeValue}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Best Value
    </span>
  );
  return null;
};

// ── Time formatter ─────────────────────────────────────────────
const fmtTime = (iso) => {
  try { return new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZoneName:'short'}); }
  catch { return '—'; }
};

// ── Alpha Hero — Live Insight Carousel ────────────────────────
// When backend is live this gets real data. For now shows "teaser" cards
// showing the value prop of the platform.
const TEASER_INSIGHTS = [
    { id:1, sport:'nba', matchup:'Lakers vs. Nuggets', stat:"LeBron Points", line:25.5, edge:15, headline:'AI detected a 15% efficiency gap', sub:"LeBron's TS% is 64.2% — significantly above his 25.5 line baseline", badge:'15% Edge', badgeType:'value' },
    { id:2, sport:'nba', matchup:'Celtics vs. Heat', stat:"Tatum Points", line:27.5, edge:8, headline:'8/10 games hit in this matchup', sub:'Jayson Tatum has exceeded 27.5 in 8 of his last 10 home games', badge:'80% Confidence', badgeType:'confidence' },
    { id:3, sport:'nba', matchup:'Warriors vs. Clippers', stat:"Curry Threes", line:3.5, edge:12, headline:'High usage rate detected', sub:"Curry's USG% spikes 22% against zone defense — Clippers run zone 68% of the time", badge:'12% Edge', badgeType:'value' },
  ];

function InsightCarousel() {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const next = () => setActive(i => (i + 1) % TEASER_INSIGHTS.length);
  const prev = () => setActive(i => (i - 1 + TEASER_INSIGHTS.length) % TEASER_INSIGHTS.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const insight = TEASER_INSIGHTS[active];

  return (
    <div className={styles.carousel}>
      <AnimatePresence mode="wait">
        <motion.div
          key={insight.id}
          className={styles.carouselSlide}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.carouselTop}>
            <div className={styles.carouselSportTag}>
              <span className={styles.carouselSportIcon}><SportIcon sport={insight.sport} /></span>
              {insight.sport.toUpperCase()}
            </div>
            <span className={styles.carouselMatchup}>{insight.matchup}</span>
          </div>

          <h2 className={styles.carouselHeadline}>{insight.headline}</h2>
          <p className={styles.carouselSub}>{insight.sub}</p>

          <div className={styles.carouselBottom}>
            <div className={styles.carouselProp}>
              <span className={styles.carouselPropLabel}>{insight.stat}</span>
              <span className={styles.carouselPropLine}>{insight.line}</span>
            </div>
            {insight.badgeType === 'value'
              ? <span className={styles.carouselBadgeValue}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>{insight.badge}</span>
              : <span className={styles.carouselBadgeConf}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>{insight.badge}</span>
            }
          </div>
        </motion.div>
      </AnimatePresence>

      <div className={styles.carouselControls}>
        <button className={styles.carouselArrow} onClick={prev}><ChevronLeft /></button>
        <div className={styles.carouselDots}>
          {TEASER_INSIGHTS.map((_, i) => (
            <button key={i} className={`${styles.dot} ${i===active?styles.dotActive:''}`} onClick={() => setActive(i)} />
          ))}
        </div>
        <button className={styles.carouselArrow} onClick={next}><ChevronRight /></button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function HomePage() {
  const dispatch    = useDispatch();
  const activeSport = useSelector(selectActiveSport);
  const isLoggedIn  = useSelector(selectIsLoggedIn);

  const { data:games=[], isLoading, error } = useQuery(
    ['games', activeSport],
    () => oddsAPI.getGames(activeSport).then(r => r.data.data),
    { staleTime: 5*60*1000 }
  );

  const active = SPORTS.find(s => s.key === activeSport);

  return (
    <div className={styles.page}>

      {/* ── SECTION 1: Alpha Hero ─────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <span className={styles.eyebrowDot} />
              Today's Prime Picks
            </div>
            <h1 className={styles.heroTitle}>
              {isLoggedIn ? 'Your Daily Picks' : 'Instant Alpha'}
              <br />
              <span className={styles.heroAccent}>Before You Bet</span>
            </h1>
            <p className={styles.heroDesc}>
              Our AI runs TS%, USG%, and eFG% formulas on every player before generating insights.
              These are today's highest-edge opportunities.
            </p>
            {!isLoggedIn && (
              <div className={styles.heroActions}>
                <Link to="/register" className={styles.heroCtaPrimary}>
                  Start Free — 3 Credits
                </Link>
                <Link to="/login" className={styles.heroCtaSecondary}>
                  Log in
                </Link>
              </div>
            )}
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><span className={styles.heroStatVal}>TS%</span><span className={styles.heroStatLbl}>True Shooting</span></div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><span className={styles.heroStatVal}>USG%</span><span className={styles.heroStatLbl}>Usage Rate</span></div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><span className={styles.heroStatVal}>eFG%</span><span className={styles.heroStatLbl}>Eff. Field Goal</span></div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><span className={styles.heroStatVal}>Edge</span><span className={styles.heroStatLbl}>Line Value %</span></div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <InsightCarousel />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Sport/League Navigation ───────────────── */}
      <section className={styles.leaguesSection}>
        <div className={styles.container}>
          <div className={styles.leaguesHead}>
            <h2 className={styles.leaguesTitle}>Select League</h2>
            <p className={styles.leaguesSub}>More leagues launching soon</p>
          </div>
          <div className={styles.leaguesGrid}>
            {SPORTS.map((s, i) => (
              <motion.button
                key={s.key}
                className={`${styles.leagueCard} ${activeSport===s.key?styles.leagueActive:''} ${!s.active?styles.leagueDisabled:''}`}
                onClick={() => s.active && dispatch(setActiveSport(s.key))}
                disabled={!s.active}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i*0.06, duration:0.3 }}
                whileHover={s.active ? { y:-2, transition:{duration:0.12} } : {}}
              >
                <div className={styles.leagueIcon}><SportIcon sport={s.key} /></div>
                <span className={styles.leagueName}>{s.name}</span>
                <span className={styles.leagueFull}>{s.full}</span>
                {s.active
                  ? <span className={styles.leagueLive}><span className={styles.leagueDot}/>Live</span>
                  : <span className={styles.leagueSoon}>Soon</span>
                }
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Live Slate ─────────────────────────────── */}
      <section className={styles.slateSection}>
        <div className={styles.container}>
          <div className={styles.slateHead}>
            <div>
              <h2 className={styles.slateTitle}>Live Slate — {active?.name}</h2>
              <p className={styles.slateSub}>Click any game to unlock AI insights on player props</p>
            </div>
            {!isLoading && <span className={styles.slateCount}>{games.length} {games.length===1?'game':'games'} today</span>}
          </div>

          {isLoading && (
            <div className={styles.slateList}>
              {[...Array(3)].map((_,i) => <div key={i} className={styles.gameCardSkeleton}><div className={styles.skPulse} /></div>)}
            </div>
          )}

          {error && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Backend not connected</p>
              <p className={styles.emptySub}>Start your server at localhost:5000 to load live games.</p>
            </div>
          )}

          {!isLoading && !error && games.length===0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><SportIcon sport={activeSport} /></div>
              <p className={styles.emptyTitle}>No games today for {active?.name}</p>
              <p className={styles.emptySub}>The morning scraper refreshes the schedule at 8 AM daily.</p>
            </div>
          )}

          {!isLoading && !error && games.length>0 && (
            <AnimatePresence mode="wait">
              <motion.div key={activeSport} className={styles.slateList}
                initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.25}}
              >
                {games.map((game, i) => (
                  <motion.div key={game._id||game.oddsEventId}
                    initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                    transition={{delay:i*0.04,duration:0.3}}
                  >
                    <Link to={`/match/${activeSport}/${game.oddsEventId}`} className={styles.gameCard}>
                      {/* Left: Teams */}
                      <div className={styles.gcTeams}>
                        <div className={styles.gcTeam}>
                          <div className={styles.gcLogo}><SportIcon sport={activeSport}/></div>
                          <div>
                            <p className={styles.gcAbbr}>{game.awayTeam?.abbreviation||'—'}</p>
                            <p className={styles.gcName}>{game.awayTeam?.name}</p>
                          </div>
                        </div>
                        <div className={styles.gcVs}>
                          <span className={styles.gcVsText}>VS</span>
                          <span className={styles.gcTime}>{fmtTime(game.startTime)}</span>
                          {game.status==='live' && <span className={styles.gcLiveTag}><span className={styles.gcLiveDot}/>LIVE</span>}
                        </div>
                        <div className={`${styles.gcTeam} ${styles.gcTeamRight}`}>
                          <div>
                            <p className={styles.gcAbbr}>{game.homeTeam?.abbreviation||'—'}</p>
                            <p className={styles.gcName}>{game.homeTeam?.name}</p>
                          </div>
                          <div className={styles.gcLogo}><SportIcon sport={activeSport}/></div>
                        </div>
                      </div>

                      {/* Center: Market line placeholder */}
                      <div className={styles.gcMarket}>
                        {game.hasProps
                          ? <><span className={styles.gcMarketLabel}>Props Available</span><span className={styles.gcPropsCount}>View Insights →</span></>
                          : <span className={styles.gcMarketPending}>Lines loading...</span>
                        }
                      </div>

                      {/* Right: Front Office Badge */}
                      <div className={styles.gcBadge}>
                        {game.hasProps ? (
                          <span className={styles.gcBadgeActive}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            AI Ready
                          </span>
                        ) : (
                          <span className={styles.gcBadgePending}>Fetching</span>
                        )}
                        <ArrowRight />
                      </div>
                    </Link>
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