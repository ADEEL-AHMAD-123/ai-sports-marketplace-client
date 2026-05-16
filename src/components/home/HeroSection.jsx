import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '@/store/slices/authSlice';
import { getStatLabel, getLeagueLogoUrl } from '@/config/sportConfig';
import styles from './HeroSection.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const API = (p) => `${API_BASE}${p}`;

const SPORT_LABEL = {
  nba:    'NBA — Basketball',
  mlb:    'MLB — Baseball',
  nhl:    'NHL — Ice Hockey',
  nfl:    'NFL — American Football',
  soccer: 'Soccer',
};

// ── Team logo with abbreviation fallback ──────────────────────
function TeamBadge({ logoUrl, abbr, size = 52 }) {
  const [err, setErr] = useState(false);
  if (!logoUrl || err) {
    return (
      <div className={styles.teamBadgeFallback} style={{ width: size, height: size }}>
        {abbr || '?'}
      </div>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={abbr || 'team'}
      width={size}
      height={size}
      className={styles.teamBadgeImg}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

// ── League badge ──────────────────────────────────────────────
function LeagueBadgeLogo({ sport }) {
  const [err, setErr] = useState(false);
  const url = getLeagueLogoUrl(sport);
  if (!url || err) {
    return <span className={styles.leagueFallback}>{(sport || '?').toUpperCase()}</span>;
  }
  return (
    <img
      src={url}
      alt={`${sport} logo`}
      width={20}
      height={20}
      className={styles.leagueLogo}
      onError={() => setErr(true)}
    />
  );
}

// Result-state badge in slide footer (HIT / pending / etc)
function ResultBadge({ result, edge, confidence }) {
  if (result === 'HIT') {
    return <span className={styles.badgeConf}>✓ HIT · {confidence != null ? `${confidence}%` : ''}{edge ? ` · ${edge} edge` : ''}</span>;
  }
  if (result === 'MISS') {
    return <span className={styles.badgeMiss}>MISS{edge ? ` · ${edge} edge` : ''}</span>;
  }
  if (result === 'PUSH') {
    return <span className={styles.badgePush}>PUSH</span>;
  }
  // Pending — show edge or confidence
  if (edge && (parseFloat(edge) > 0)) {
    return <span className={styles.badgeEdge}>{edge} Edge · Pending</span>;
  }
  if (confidence != null) {
    return <span className={styles.badgeConf}>{confidence}% Confidence</span>;
  }
  return <span className={styles.badgePending}>Pending Result</span>;
}

const ChevL = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevR = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ArrowR = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

// ── InsightCarousel — fetches from /api/insights/featured-recent ─
// On mount: tries the public API, expects an array of real insights.
// While loading or if API empty, shows a single static placeholder slide
// so the hero never breaks; hidden the moment real data arrives.
function InsightCarousel() {
  const [slides, setSlides]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [idx, setIdx]           = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timer = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(API('/insights/featured-recent?limit=6'), {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setSlides(json.data);
        }
      } catch {
        /* fall through to placeholder */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const next = () => setIdx(i => (i + 1) % Math.max(1, slides.length));
  const prev = () => setIdx(i => (i - 1 + Math.max(1, slides.length)) % Math.max(1, slides.length));

  useEffect(() => {
    if (reduceMotion || isPaused || slides.length < 2) return undefined;
    timer.current = setInterval(next, 6000);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, isPaused, slides.length]);

  // Placeholder slide while we fetch / when API has zero results
  const PLACEHOLDER_SLIDE = {
    id: 'placeholder',
    sport: 'nba',
    player: 'Live insights load here',
    statType: 'Points',
    line: 0,
    recommendation: 'over',
    edge: null,
    confidence: null,
    summary: 'Once games finalize and the AI grades a few picks, real recent insights show up here automatically.',
    homeAbbr: '—', awayAbbr: '—',
    homeTeam: 'Home', awayTeam: 'Away',
    homeLogoUrl: null, awayLogoUrl: null,
    result: null,
  };

  const visible = slides.length > 0 ? slides : [PLACEHOLDER_SLIDE];
  const s       = visible[idx % visible.length];
  const isPlaceholder = s.id === 'placeholder';

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
      aria-label="Recent AI scout insights"
    >
      <div className={styles.carouselTopBar} />

      {/* Header: league + status */}
      <div className={styles.carouselHeader}>
        <div className={styles.carouselLeague}>
          <LeagueBadgeLogo sport={s.sport} />
          <span>{SPORT_LABEL[s.sport] || s.league || (s.sport || '').toUpperCase()}</span>
        </div>
        <span className={styles.carouselLiveTag}>
          <span className={styles.liveDot} />
          {loading ? 'Loading' : isPlaceholder ? 'Awaiting data' : 'Live Scout'}
        </span>
      </div>

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
          {(s.awayAbbr || s.homeAbbr) && (
            <div className={styles.matchup}>
              <div className={styles.matchupTeam}>
                <TeamBadge logoUrl={s.awayLogoUrl} abbr={s.awayAbbr} size={52} />
                <div>
                  <p className={styles.teamAbbr}>{s.awayAbbr || '—'}</p>
                  <p className={styles.teamName}>{s.awayTeam || ''}</p>
                </div>
              </div>
              <div className={styles.matchupVs}>
                <span className={styles.vsText}>VS</span>
              </div>
              <div className={`${styles.matchupTeam} ${styles.matchupTeamR}`}>
                <div className={styles.teamInfoR}>
                  <p className={styles.teamAbbr}>{s.homeAbbr || '—'}</p>
                  <p className={styles.teamName}>{s.homeTeam || ''}</p>
                </div>
                <TeamBadge logoUrl={s.homeLogoUrl} abbr={s.homeAbbr} size={52} />
              </div>
            </div>
          )}

          {/* AI scout text */}
          <div className={styles.insightCard}>
            <div className={styles.insightCardLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              AI Scout Analysis
            </div>
            <p className={styles.insightText}>
              {s.summary || (s.player && s.statType
                ? `${s.player} — ${(s.recommendation || '').toUpperCase()} ${s.line} ${getStatLabel(s.sport, s.statType)}.`
                : 'Loading recent insights…')}
            </p>
          </div>

          {/* Footer: stat + line + result/edge */}
          <div className={styles.slideFooter}>
            <div className={styles.propBlock}>
              <span className={styles.propLbl}>
                {s.player ? `${s.player} · ${getStatLabel(s.sport, s.statType)}` : 'Stat'}
              </span>
              <span className={styles.propLine}>
                {s.recommendation === 'over' ? 'O' : s.recommendation === 'under' ? 'U' : ''} {s.line}
              </span>
            </div>
            <div className={styles.slideRight}>
              <ResultBadge result={s.result} edge={s.edge} confidence={s.confidence} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {visible.length > 1 && (
        <div className={styles.controls}>
          <button type="button" className={styles.ctrlBtn} onClick={prev} aria-label="Previous insight"><ChevL /></button>
          <div className={styles.dots}>
            {visible.map((_, i) => (
              <button
                type="button"
                key={i}
                className={i === (idx % visible.length) ? styles.dotActive : styles.dot}
                onClick={() => setIdx(i)}
                aria-label={`Go to insight ${i + 1}`}
                aria-current={i === idx ? 'true' : 'false'}
              />
            ))}
          </div>
          <button type="button" className={styles.ctrlBtn} onClick={next} aria-label="Next insight"><ChevR /></button>
          {!reduceMotion && (
            <button
              type="button"
              className={`${styles.ctrlBtn} ${styles.pauseBtn}`}
              onClick={() => setIsPaused(p => !p)}
              aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
          )}
        </div>
      )}
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
            insights across NBA, NFL, MLB, NHL and Soccer — delivered before the game even starts.
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
              { val: '5',         lbl: 'Sports Live' },
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
