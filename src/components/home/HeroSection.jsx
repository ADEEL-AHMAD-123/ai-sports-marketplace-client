import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '@/store/slices/authSlice';
import styles from './HeroSection.module.scss';

// ── League logo via API-Sports CDN ────────────────────────────
const LEAGUE_LOGOS = {
  nba:    'https://media.api-sports.io/basketball/leagues/12.png',
  nfl:    'https://media.api-sports.io/american-football/leagues/1.png',
  mlb:    'https://media.api-sports.io/baseball/leagues/1.png',
  nhl:    'https://media.api-sports.io/hockey/leagues/57.png',
  soccer: 'https://media.api-sports.io/football/leagues/39.png',
};

// Team logo via API-Sports CDN — falls back to abbr pill
function TeamBadge({ apiId, abbr, sport, size = 48 }) {
  const [err, setErr] = useState(false);
  const src = sport === 'nba'
    ? `https://media.api-sports.io/basketball/teams/${apiId}.png`
    : sport === 'nfl'
    ? `https://media.api-sports.io/american-football/teams/${apiId}.png`
    : `https://media.api-sports.io/football/teams/${apiId}.png`;

  if (!apiId || err) {
    return (
      <div className={styles.teamBadgeFallback} style={{ width: size, height: size }}>
        {abbr}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={abbr}
      width={size}
      height={size}
      className={styles.teamBadgeImg}
      onError={() => setErr(true)}
    />
  );
}

function LeagueBadgeLogo({ sport, leagueLabel }) {
  const [err, setErr] = useState(false);
  if (err || !LEAGUE_LOGOS[sport]) {
    return <span className={styles.leagueFallback}>{sport.toUpperCase()}</span>;
  }
  return (
    <img
      src={LEAGUE_LOGOS[sport]}
      alt={`${leagueLabel} logo`}
      width={20}
      height={20}
      className={styles.leagueLogo}
      onError={() => setErr(true)}
    />
  );
}

// ── Carousel data — one teaser per sport genre ────────────────
const SLIDES = [
  {
    id: 1,
    sport: 'nba',
    leagueLabel: 'NBA — Basketball',
    away: { abbr: 'LAL', name: 'Los Angeles Lakers', apiId: 145 },
    home: { abbr: 'DEN', name: 'Denver Nuggets',     apiId: 140 },
    stat: 'LeBron Points',
    line: 25.5,
    type: 'value',
    badge: '+15% Edge',
    insight: "LeBron's TS% is 64.2% this month — 18pts above the league average. The formula flags a strong OVER signal on the 25.5 line.",
  },
  {
    id: 2,
    sport: 'nfl',
    leagueLabel: 'NFL — American Football',
    away: { abbr: 'KC',  name: 'Kansas City Chiefs', apiId: 9   },
    home: { abbr: 'BUF', name: 'Buffalo Bills',      apiId: 2   },
    stat: 'Mahomes Pass Yards',
    line: 267.5,
    type: 'conf',
    badge: '78% Confidence',
    insight: "Mahomes averages 311 yards in outdoor cold-weather games. Bills home forecast: 28°F. Model rates OVER at 78% confidence.",
  },
  {
    id: 3,
    sport: 'soccer',
    leagueLabel: 'Premier League — Football',
    away: { abbr: 'ARS', name: 'Arsenal FC', apiId: 42 },
    home: { abbr: 'CHE', name: 'Chelsea FC',  apiId: 49 },
    stat: 'Total Goals O/U',
    line: 2.5,
    type: 'value',
    badge: '+12% Edge',
    insight: "Arsenal's xG over last 6 home matches averages 2.8. Chelsea concede 1.6/game away. Model detects a strong OVER signal.",
  },
];

// ── Chevron icons ─────────────────────────────────────────────
const ChevL = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevR = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ArrowR = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

// ── Insight Carousel ──────────────────────────────────────────
function InsightCarousel() {
  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timer = useRef(null);
  const reduceMotion = useReducedMotion();
  const next = () => setIdx(i => (i + 1) % SLIDES.length);
  const prev = () => setIdx(i => (i - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (reduceMotion || isPaused) return undefined;
    timer.current = setInterval(next, 6000);
    return () => clearInterval(timer.current);
  }, [reduceMotion, isPaused]);

  const s = SLIDES[idx];

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Featured AI insight previews"
    >
      <div className={styles.carouselTopBar} />

      {/* Header: league + sport count */}
      <div className={styles.carouselHeader}>
        <div className={styles.carouselLeague}>
          <LeagueBadgeLogo sport={s.sport} leagueLabel={s.leagueLabel} />
          <span>{s.leagueLabel}</span>
        </div>
        <span className={styles.carouselLiveTag}>
          <span className={styles.liveDot} />
          Live Scout
        </span>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          className={styles.slide}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {/* Matchup row */}
          <div className={styles.matchup}>
            <div className={styles.matchupTeam}>
              <TeamBadge apiId={s.away.apiId} abbr={s.away.abbr} sport={s.sport} size={52} />
              <div>
                <p className={styles.teamAbbr}>{s.away.abbr}</p>
                <p className={styles.teamName}>{s.away.name}</p>
              </div>
            </div>
            <div className={styles.matchupVs}>
              <span className={styles.vsText}>VS</span>
            </div>
            <div className={`${styles.matchupTeam} ${styles.matchupTeamR}`}>
              <div className={styles.teamInfoR}>
                <p className={styles.teamAbbr}>{s.home.abbr}</p>
                <p className={styles.teamName}>{s.home.name}</p>
              </div>
              <TeamBadge apiId={s.home.apiId} abbr={s.home.abbr} sport={s.sport} size={52} />
            </div>
          </div>

          {/* AI Insight text */}
          <div className={styles.insightCard}>
            <div className={styles.insightCardLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              AI Scout Analysis
            </div>
            <p className={styles.insightText}>{s.insight}</p>
          </div>

          {/* Footer */}
          <div className={styles.slideFooter}>
            <div className={styles.propBlock}>
              <span className={styles.propLbl}>{s.stat}</span>
              <span className={styles.propLine}>{s.line}</span>
            </div>
            <div className={styles.slideRight}>
              {s.type === 'value'
                ? <span className={styles.badgeEdge}>{s.badge}</span>
                : <span className={styles.badgeConf}>{s.badge}</span>
              }
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel controls */}
      <div className={styles.controls}>
        <button type="button" className={styles.ctrlBtn} onClick={prev} aria-label="Previous insight slide"><ChevL /></button>
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              type="button"
              key={i}
              className={i === idx ? styles.dotActive : styles.dot}
              onClick={() => setIdx(i)}
              aria-label={`Go to insight slide ${i + 1}`}
              aria-current={i === idx ? 'true' : 'false'}
            />
          ))}
        </div>
        <button type="button" className={styles.ctrlBtn} onClick={next} aria-label="Next insight slide"><ChevR /></button>
        {!reduceMotion && (
          <button
            type="button"
            className={`${styles.ctrlBtn} ${styles.pauseBtn}`}
            onClick={() => setIsPaused(p => !p)}
            aria-label={isPaused ? 'Resume carousel autoplay' : 'Pause carousel autoplay'}
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────
export default function HeroSection() {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={styles.heroGrid}>

        {/* LEFT — copy */}
        <motion.div
          className={styles.heroLeft}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Institutional-Grade Sports Intelligence
          </div>

          <h1 className={styles.headline}>
            The Math the Bookies<br />
            <em className={styles.headlineAccent}>Hope You Don't Have.</em>
          </h1>

          <p className={styles.subheadline}>
            Every line has a weakness. Our AI-driven scouting engine scans the global markets
            to identify the efficiency gaps the house missed. Access institutional-grade
            insights with NBA live now and more leagues rolling out soon — delivered before the game even starts.
          </p>

          {!isLoggedIn ? (
            <div className={styles.actions}>
              <Link to="/register" className={styles.btnPrimary}>
                Get Your Edge Free
                <ArrowR />
              </Link>
              <Link to="/login" className={styles.btnGhost}>
                Sign in
              </Link>
            </div>
          ) : (
            <div className={styles.actions}>
              <p className={styles.welcomeBack}>
                <span className={styles.eyebrowDot} />
                Your edge is ready. Scroll down for today's slate.
              </p>
            </div>
          )}

          {/* Stats strip */}
          <div className={styles.statsStrip}>
            {[
  { val: 'AI',        lbl: 'Powered Analysis' },
  { val: '3',         lbl: 'Stat Windows' },
  { val: 'Real-time', lbl: 'Odds Tracking' },
  { val: 'Free',      lbl: '3 Credits Start' },
].map(({ val, lbl }, i, a) => (
              <React.Fragment key={val}>
                <div className={styles.stat}>
                  <span className={styles.statVal}>{val}</span>
                  <span className={styles.statLbl}>{lbl}</span>
                </div>
                {i < a.length - 1 && <div className={styles.statDivider} />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — carousel */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <InsightCarousel />
        </motion.div>
      </div>
    </section>
  );
}