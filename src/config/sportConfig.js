/**
 * sportConfig.js — Frontend sport configuration
 *
 * SINGLE SOURCE OF TRUTH for all sport-specific details in the frontend.
 * All components (PropCard, MatchPage, InsightModal, LiveSlate, LeagueGrid)
 * read from this file — nothing is hardcoded elsewhere.
 *
 * TO ADD A NEW SPORT:
 *  1. Add an entry to SPORT_CONFIG below with isActive: true
 *  2. Add the adapter on the server (adapterRegistry.js)
 *  3. Done — all UI components pick it up automatically
 */

export const SPORT_CONFIG = {
  nba: {
    key: 'nba', label: 'NBA', fullName: 'Basketball', region: 'North America',
    isActive: true,
    leagueId: 12,
    teamBase: 'basketball',
    leagueLogoUrl: 'https://media.api-sports.io/basketball/leagues/12.png',
    statLabels: {
      points:         'Points',
      rebounds:       'Rebounds',
      assists:        'Assists',
      threes:         '3-Pointers',
      points_assists: 'Pts+Ast',
    },
    statUnits: {
      points:         'pts',
      rebounds:       'reb',
      assists:        'ast',
      threes:         '3s',
      points_assists: 'p+a',
    },
    advancedMetrics: ['TS%', 'eFG%', 'USG%'],
    predNote: 'Points and 3s use 5-game form. Rebounds and assists use 8-game form.',
    badges: {
      highConfidenceLabel: 'HC',
      bestValueLabel: 'BV',
      statTypeBadges: {},
      dataQualityRules: {
        strongMinConfidence: 70,
        weakMaxConfidence: 79,
      },
    },
    filters: {
      highConfidenceHint: 'Top consistency for NBA window',
      bestValueHint: '15%+ edge on line',
    },
    injury: {
      supported: true,
      provider: 'api-sports-nba',
      providerLabel: 'API-Sports NBA',
    },
    showPitcherHand: false,
    showEnvironment: false,
  },

  mlb: {
    key: 'mlb', label: 'MLB', fullName: 'Baseball', region: 'North America',
    isActive: true,
    leagueId: 1,
    teamBase: 'baseball',
    leagueLogoUrl: 'https://media.api-sports.io/baseball/leagues/1.png',
    statLabels: {
      hits:               'Hits',
      total_bases:        'Total Bases',
      pitcher_strikeouts: 'Strikeouts (P)',
      rbis:               'RBIs',
      runs:               'Runs',
    },
    statUnits: {
      hits:               'H',
      total_bases:        'TB',
      pitcher_strikeouts: 'K',
      rbis:               'RBI',
      runs:               'R',
    },
    advancedMetrics: ['K/9', 'ERA', 'AVG'],
    predNote: 'Pitcher Ks use 5-start window. Batter props use 10-game window with L/R platoon splits.',
    badges: {
      highConfidenceLabel: 'HC',
      bestValueLabel: 'BV',
      statTypeBadges: {
        pitcher_strikeouts: { label: 'P', title: 'Pitcher prop' },
      },
      dataQualityRules: {
        strongMinConfidence: 65,
        weakMaxConfidence: 84,
      },
    },
    filters: {
      highConfidenceHint: 'Consistent over recent MLB game logs',
      bestValueHint: '15%+ edge on line',
    },
    injury: {
      supported: true,
      provider: 'mlb-stats-api',
      providerLabel: 'MLB Stats API (Official, Free)',
    },
    showPitcherHand: true,
    showEnvironment: true,
  },

  nhl: {
    key: 'nhl', label: 'NHL', fullName: 'Ice Hockey', region: 'North America',
    isActive: true,
    leagueId: 57,
    teamBase: 'hockey',
    leagueLogoUrl: 'https://media.api-sports.io/hockey/leagues/57.png',
    statLabels: {
      goals:         'Goals',
      assists:       'Assists',
      points:        'Points (G+A)',
      shots_on_goal: 'Shots on Goal',
    },
    statUnits: {
      goals:         'G',
      assists:       'A',
      points:        'PTS',
      shots_on_goal: 'SOG',
    },
    advancedMetrics: ['SOG/g', 'TOI', 'G+A'],
    predNote: 'Shots on goal most consistent. Goals/assists use 10-game window.',
    badges: {
      highConfidenceLabel: 'HC',
      bestValueLabel: 'BV',
      statTypeBadges: {},
      dataQualityRules: {
        strongMinConfidence: 65,
        weakMaxConfidence: 84,
      },
    },
    filters: {
      highConfidenceHint: 'Consistent over recent NHL game logs',
      bestValueHint: '15%+ edge on line',
    },
    injury: {
      supported: false,
      provider: null,
      providerLabel: null,
    },
    showPitcherHand: false,
    showEnvironment: false,
  },

  nfl: {
    key: 'nfl', label: 'NFL', fullName: 'American Football', region: 'North America',
    isActive: false,
    leagueId: 1,
    teamBase: 'american-football',
    leagueLogoUrl: 'https://media.api-sports.io/american-football/leagues/1.png',
    statLabels: {}, statUnits: {}, advancedMetrics: [], predNote: 'Coming soon.',
    badges: {
      highConfidenceLabel: 'HC', bestValueLabel: 'BV',
      statTypeBadges: {}, dataQualityRules: {},
    },
    filters: { highConfidenceHint: '', bestValueHint: '' },
    injury: { supported: false, provider: null, providerLabel: null },
    showPitcherHand: false, showEnvironment: false,
  },

  soccer: {
    key: 'soccer', label: 'Soccer', fullName: 'Premier League', region: 'Global',
    isActive: false,
    leagueId: 39,
    teamBase: 'football',
    leagueLogoUrl: 'https://media.api-sports.io/football/leagues/39.png',
    statLabels: {}, statUnits: {}, advancedMetrics: [], predNote: 'Coming soon.',
    badges: {
      highConfidenceLabel: 'HC', bestValueLabel: 'BV',
      statTypeBadges: {}, dataQualityRules: {},
    },
    filters: { highConfidenceHint: '', bestValueHint: '' },
    injury: { supported: false, provider: null, providerLabel: null },
    showPitcherHand: false, showEnvironment: false,
  },
};

// ─── Helpers (all unchanged from original) ────────────────────────────────────

export const getLeagueLogoUrl = (sport) => SPORT_CONFIG[sport]?.leagueLogoUrl || null;
export const getStatLabel     = (sport, statType) => SPORT_CONFIG[sport]?.statLabels?.[statType] || statType;
export const getStatUnit      = (sport, statType) => SPORT_CONFIG[sport]?.statUnits?.[statType] || '';
export const getSportConfig   = (sport) => SPORT_CONFIG[sport] || SPORT_CONFIG.nba;
export const getSportBadges   = (sport) => getSportConfig(sport).badges || {};

export const getInjuryProvider = (sport) => getSportConfig(sport).injury || {
  supported: false,
  provider: null,
  providerLabel: null,
};
export const getInjuryProviderLabel = (sport) =>
  getInjuryProvider(sport).providerLabel || 'Injury API unavailable';

export const getFilterDefsForSport = (sport) => {
  const cfg = getSportConfig(sport);
  return [
    { key: 'all',            label: 'All Props',       hint: '',                                             icon: '≡' },
    { key: 'highConfidence', label: 'High Confidence', hint: cfg.filters?.highConfidenceHint || 'Strong consistency', icon: '↗' },
    { key: 'bestValue',      label: 'Best Value',      hint: cfg.filters?.bestValueHint || 'Strong edge',            icon: '⚡' },
  ];
};

export const getStatTypeBadge = (sport, statType) => {
  const badge = getSportBadges(sport).statTypeBadges?.[statType];
  return badge || null;
};

export const shouldShowStrongDataBadge = (sport, dataQuality, confidenceScore) => {
  const rules  = getSportBadges(sport).dataQualityRules || {};
  const minConf = rules.strongMinConfidence ?? 70;
  return dataQuality === 'strong' && (confidenceScore ?? 0) >= minConf;
};

export const shouldShowWeakDataBadge = (sport, dataQuality, confidenceScore) => {
  const rules  = getSportBadges(sport).dataQualityRules || {};
  const maxConf = rules.weakMaxConfidence ?? 79;
  return dataQuality === 'weak' && (confidenceScore ?? 0) <= maxConf;
};

export const getActiveSports = () => Object.values(SPORT_CONFIG).filter(s => s.isActive);
export const getAllSports     = () => Object.values(SPORT_CONFIG);

