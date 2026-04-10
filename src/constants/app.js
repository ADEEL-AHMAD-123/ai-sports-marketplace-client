// constants/app.js — Frontend constants
// Keep all hardcoded values here so they're easy to update

export const SPORTS = [
  { key: 'nba',    label: 'NBA',    emoji: '🏀', active: true  },
  { key: 'nfl',    label: 'NFL',    emoji: '🏈', active: false },
  { key: 'mlb',    label: 'MLB',    emoji: '⚾', active: false },
  { key: 'nhl',    label: 'NHL',    emoji: '🏒', active: false },
  { key: 'soccer', label: 'Soccer', emoji: '⚽', active: false },
];

// To add a new sport later: add it to SPORTS above with active: true
// The SportTabs component reads this array automatically

export const FILTERS = [
  { key: 'all',            label: 'All Bets',        icon: '◈' },
  { key: 'highConfidence', label: 'High Confidence',  icon: '🎯' },
  { key: 'bestValue',      label: 'Best Value',       icon: '⚡' },
];

export const CREDITS_FREE_ON_SIGNUP = 3;
export const CREDITS_PER_INSIGHT    = 1;

export const CREDIT_PACKS_FALLBACK = [
  { id: 'pack_1', credits: 1,  amount: 0.99, label: '1 Credit' },
  { id: 'pack_6', credits: 6,  amount: 4.99, label: '6 Credits' },
];

export const BET_DIRECTION = {
  OVER:  'over',
  UNDER: 'under',
};

export const USER_ROLES = {
  USER:  'user',
  ADMIN: 'admin',
};

export const TRANSACTION_TYPE_LABELS = {
  signup_bonus:    'Welcome bonus',
  purchase:        'Credit purchase',
  insight_unlock:  'Insight unlocked',
  refund:          'Refund',
  admin_grant:     'Admin adjustment',
};