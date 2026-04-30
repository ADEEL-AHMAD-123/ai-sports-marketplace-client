// constants/app.js — Frontend constants

// ── Sports ────────────────────────────────────────────────────
export const SPORTS = [
  { key: 'nba',    label: 'NBA',    emoji: '🏀', active: true  },
  { key: 'mlb',    label: 'MLB',    emoji: '⚾', active: true  },
  { key: 'nhl',    label: 'NHL',    emoji: '🏒', active: true  },
  { key: 'nfl',    label: 'NFL',    emoji: '🏈', active: false },
  { key: 'soccer', label: 'Soccer', emoji: '⚽', active: false },
];

// ── Filters ───────────────────────────────────────────────────
export const FILTERS = [
  { key: 'all',            label: 'All Bets',       icon: '◈' },
  { key: 'highConfidence', label: 'High Confidence', icon: '🎯' },
  { key: 'bestValue',      label: 'Best Value',      icon: '⚡' },
];

// ── Credits ───────────────────────────────────────────────────
export const CREDITS_FREE_ON_SIGNUP = 3;
export const CREDITS_PER_INSIGHT    = 1;

export const CREDIT_PACKS_FALLBACK = [
  { id: 'pack_1', credits: 1, amount: 0.99, label: '1 Credit'  },
  { id: 'pack_6', credits: 6, amount: 4.99, label: '6 Credits' },
];

// ── Bet direction ─────────────────────────────────────────────
export const BET_DIRECTION = {
  OVER:  'over',
  UNDER: 'under',
};

// ── User roles ────────────────────────────────────────────────
export const USER_ROLES = {
  USER:  'user',
  ADMIN: 'admin',
};

// ── Transaction labels (used by WalletPage) ───────────────────
export const TRANSACTION_TYPE_LABELS = {
  signup_bonus:   'Welcome bonus',
  purchase:       'Credit purchase',
  insight_unlock: 'Insight unlocked',
  refund:         'Refund',
  admin_grant:    'Admin adjustment',
};

// ── Admin cron jobs ───────────────────────────────────────────
export const CRON_JOBS = [
  {
    key:   'morning-scraper',
    label: 'Morning Scraper',
    icon:  '📅',
    desc:  "Fetches today's games from The Odds API for all active sports and saves them to MongoDB.",
    when:  'Runs automatically at 7AM UTC every day.',
    group: 'scheduled',
  },
  {
    key:   'prop-watcher',
    label: 'Prop Watcher (All)',
    icon:  '👁',
    desc:  'Fetches all player props for all active sports in parallel, resolves player IDs, scores props.',
    when:  'Runs every 30 minutes.',
    group: 'scheduled',
  },
  {
    key:   'prop-watcher-nba',
    label: 'Prop Watcher — NBA',
    icon:  '🏀',
    desc:  'NBA only: fetch props, resolve player IDs, score confidence + edge.',
    when:  'Run to test NBA in isolation without affecting MLB/NHL.',
    group: 'sport',
  },
  {
    key:   'prop-watcher-mlb',
    label: 'Prop Watcher — MLB',
    icon:  '⚾',
    desc:  'MLB only: fetch props, enrich with starter context, score.',
    when:  'Run to test MLB in isolation.',
    group: 'sport',
  },
  {
    key:   'prop-watcher-nhl',
    label: 'Prop Watcher — NHL',
    icon:  '🏒',
    desc:  'NHL only: fetch props, score shots/goals/assists.',
    when:  'Run to test NHL in isolation.',
    group: 'sport',
  },
  {
    key:   'post-game-sync',
    label: 'Post-Game Sync (All)',
    icon:  '🔄',
    desc:  'Marks completed games as final for all sports in parallel. Grades prediction outcomes.',
    when:  'Runs every 15 minutes.',
    group: 'scheduled',
  },
  {
    key:   'post-game-sync-nba',
    label: 'Post-Game Sync — NBA',
    icon:  '🏀',
    desc:  'NBA only: SCHEDULED → LIVE → FINAL transitions + outcome grading.',
    when:  'Run to test NBA lifecycle in isolation.',
    group: 'sport',
  },
  {
    key:   'post-game-sync-mlb',
    label: 'Post-Game Sync — MLB',
    icon:  '⚾',
    desc:  'MLB only: game lifecycle + outcome grading.',
    when:  'Run to test MLB lifecycle in isolation.',
    group: 'sport',
  },
  {
    key:   'post-game-sync-nhl',
    label: 'Post-Game Sync — NHL',
    icon:  '🏒',
    desc:  'NHL only: game lifecycle + outcome grading.',
    when:  'Run to test NHL lifecycle in isolation.',
    group: 'sport',
  },
  {
    key:   'ai-log-cleanup',
    label: 'AI Log Cleanup',
    icon:  '🗑',
    desc:  'Removes AI prompt/response logs older than 30 days. Does NOT delete insights.',
    when:  'Safe to run any time. Runs daily at 3AM UTC.',
    group: 'scheduled',
  },
];

export const CRON_GROUPS = {
  scheduled: { label: 'Scheduled Jobs',    color: 'var(--color-info)'    },
  sport:     { label: 'Per-Sport Testing', color: 'var(--color-warning)' },
};