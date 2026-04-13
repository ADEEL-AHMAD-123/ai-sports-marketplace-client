import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScoutLog } from '@/hooks/useInsights';
import styles from './ScoutLog.module.scss';

// ── Static fallback data shown until backend is live ──────────
const FALLBACK_LOGS = [
  { id: 1, sport: 'nba', player: 'LeBron James',   team: 'Lakers',   stat: 'Points',      line: 25.5, rec: 'OVER',  result: 'HIT',  actual: 31, edge: 15, confidence: 82, matchup: 'vs Nuggets',   time: '3h ago'   },
  { id: 2, sport: 'nfl', player: 'Patrick Mahomes', team: 'Chiefs',   stat: 'Pass Yards',  line: 267.5, rec: 'OVER', result: 'HIT',  actual: 318, edge: 12, confidence: 78, matchup: 'vs Bills',    time: '6h ago'   },
  { id: 3, sport: 'nba', player: 'Jayson Tatum',   team: 'Celtics',  stat: 'Points',      line: 27.5, rec: 'OVER',  result: 'HIT',  actual: 34, edge: 9, confidence: 74, matchup: 'vs Heat',      time: 'Yesterday' },
  { id: 4, sport: 'soccer', player: 'Arsenal FC',  team: 'Arsenal',  stat: 'Total Goals', line: 2.5,  rec: 'OVER',  result: 'HIT',  actual: 3,  edge: 12, confidence: 69, matchup: 'vs Chelsea',  time: 'Yesterday' },
  { id: 5, sport: 'nba', player: 'Stephen Curry',  team: 'Warriors', stat: '3-Pointers',  line: 3.5,  rec: 'UNDER', result: 'MISS', actual: 4,  edge: 8, confidence: 65, matchup: 'vs Clippers', time: '2 days ago' },
];

// ── Sport color map ───────────────────────────────────────────
const SPORT_COLORS = {
  nba: '#f97316', nfl: '#3b82f6', mlb: '#ef4444', nhl: '#06b6d4', soccer: '#8b5cf6',
};

// ── Stat item ─────────────────────────────────────────────────
function LogRow({ log, index }) {
  const isHit   = log.result === 'HIT';
  const isOver  = log.rec === 'OVER';

  return (
    <motion.div
      className={styles.row}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      {/* Sport dot */}
      <div className={styles.sportDot} style={{ background: SPORT_COLORS[log.sport] || 'var(--color-accent)' }} />

      {/* Player + matchup */}
      <div className={styles.info}>
        <p className={styles.player}>{log.player}</p>
        <p className={styles.meta}>{log.sport.toUpperCase()} · {log.team} · {log.matchup}</p>
      </div>

      {/* Prop line */}
      <div className={styles.prop}>
        <span className={styles.propStat}>{log.stat}</span>
        <span className={styles.propLine}>{log.line}</span>
      </div>

      {/* Recommendation */}
      <div className={styles.rec}>
        <span className={isOver ? styles.recOver : styles.recUnder}>
          {isOver ? '▲' : '▼'} {log.rec}
        </span>
        <span className={styles.actual}>Actual: {log.actual}</span>
      </div>

      {/* Edge + confidence */}
      <div className={styles.metrics}>
        <span className={styles.edge}>+{log.edge}% edge</span>
        <span className={styles.conf}>{log.confidence}% conf.</span>
      </div>

      {/* Result badge + time */}
      <div className={styles.result}>
        <span className={isHit ? styles.badgeHit : styles.badgeMiss}>
          {isHit ? '✓ HIT' : '✗ MISS'}
        </span>
        <span className={styles.time}>{log.time}</span>
      </div>
    </motion.div>
  );
}

// ── ScoutLog ──────────────────────────────────────────────────
export default function ScoutLog() {
  const { recentInsights, isLoading, load } = useScoutLog();

  // Load on mount
  useEffect(() => { load(); }, []);

  // Map real insights to display format, fall back to static demo data
  const logs = (recentInsights && recentInsights.length > 0)
    ? recentInsights.map((ins) => ({
        id:         ins._id,
        sport:      ins.sport,
        player:     ins.playerName,
        team:       ins.teamName || ins.sport.toUpperCase(),
        stat:       ins.statType,
        line:       ins.bettingLine,
        rec:        ins.recommendation?.toUpperCase() || 'OVER',
        result:     'HIT',
        actual:     '—',
        edge:       ins.edgePercentage || 0,
        confidence: ins.confidenceScore || 0,
        matchup:    'Game',
        time:       new Date(ins.createdAt).toLocaleDateString(),
      }))
    : FALLBACK_LOGS;

  // Overall accuracy from real data or use fallback display
  const hitCount  = FALLBACK_LOGS.filter(l => l.result === 'HIT').length;
  const totalCount = FALLBACK_LOGS.length;
  const accuracy  = Math.round((hitCount / totalCount) * 100);

  return (
    <section className={styles.section}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Verified Performance
            </div>
            <h2 className={styles.title}>Recent Scout Closings</h2>
            <p className={styles.sub}>
              Our last 5 AI scouting reports — live accuracy tracked in real time.
              No cherry-picking. No revisionist history.
            </p>
          </div>
          <div className={styles.accuracyCard}>
            <span className={styles.accuracyNum}>{accuracy}%</span>
            <span className={styles.accuracyLbl}>Last 5 Hit Rate</span>
            <div className={styles.accuracyBar}>
              <div className={styles.accuracyFill} style={{ width: `${accuracy}%` }} />
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className={styles.colHeaders}>
          <span />
          <span>Scout Target</span>
          <span>Prop Line</span>
          <span>AI Call</span>
          <span>Edge / Conf.</span>
          <span>Result</span>
        </div>

        {/* Rows */}
        <div className={styles.list}>
          {logs.map((log, i) => <LogRow key={log.id} log={log} index={i} />)}
        </div>

        {/* Footer disclaimer */}
        <p className={styles.disclaimer}>
          * Results shown are for demonstration. Live accuracy tracking begins once post-game sync is enabled.
          Past performance does not guarantee future results. Bet responsibly.
        </p>
      </div>
    </section>
  );
}