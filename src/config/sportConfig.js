/**
 * sportConfig.js — Frontend sport configuration
 *
 * SINGLE SOURCE OF TRUTH for all sport-specific details in the frontend.
 * All components (PropCard, MatchPage, InsightModal, LiveSlate, LeagueGrid)
 * read from this file — nothing is hardcoded elsewhere.
 *
 * TO ADD A NEW SPORT:
 *  1. Add an entry to SPORT_CONFIG below
 *  2. Add the team IDs in NBAAdapter/_teamId or equivalent on the server
 *  3. Done — all UI components pick it up automatically
 */

export const SPORT_CONFIG = {
  nba: {
    key: 'nba', label: 'NBA', fullName: 'Basketball', region: 'North America',
    isActive: true,
    leagueId: 12,
    teamBase: 'basketball',
    leagueLogoUrl: 'https://media.api-sports.io/basketball/leagues/12.png',
    statLabels: { points:'Points', rebounds:'Rebounds', assists:'Assists', threes:'3-Pointers' },
    statUnits:  { points:'pts', rebounds:'reb', assists:'ast', threes:'3s' },
    advancedMetrics: ['TS%','eFG%','USG%'],
    predNote: 'Points and 3s use 5-game form. Rebounds and assists use 8-game form.',
    showPitcherHand: false,
    showEnvironment: false,
  },
  mlb: {
    key: 'mlb', label: 'MLB', fullName: 'Baseball', region: 'North America',
    isActive: true,
    leagueId: 1,
    teamBase: 'baseball',
    leagueLogoUrl: 'https://media.api-sports.io/baseball/leagues/1.png',
    statLabels: { hits:'Hits', total_bases:'Total Bases', pitcher_strikeouts:'Strikeouts (P)', rbis:'RBIs', runs_scored:'Runs' },
    statUnits:  { hits:'H', total_bases:'TB', pitcher_strikeouts:'K', rbis:'RBI', runs_scored:'R' },
    advancedMetrics: ['K/9','ERA','AVG'],
    predNote: 'Pitcher Ks use 5-start window. Batter props use 10-game window with L/R platoon splits.',
    showPitcherHand: true,
    showEnvironment: true,
  },
  nfl: {
    key: 'nfl', label: 'NFL', fullName: 'American Football', region: 'North America',
    isActive: false,
    leagueId: 1,
    teamBase: 'american-football',
    leagueLogoUrl: 'https://media.api-sports.io/american-football/leagues/1.png',
    statLabels: {}, statUnits: {}, advancedMetrics: [], predNote: 'Coming soon.',
    showPitcherHand: false, showEnvironment: false,
  },
  nhl: {
    key: 'nhl', label: 'NHL', fullName: 'Ice Hockey', region: 'North America',
    isActive: false,
    leagueId: 57,
    teamBase: 'hockey',
    leagueLogoUrl: 'https://media.api-sports.io/hockey/leagues/57.png',
    statLabels: {}, statUnits: {}, advancedMetrics: [], predNote: 'Coming soon.',
    showPitcherHand: false, showEnvironment: false,
  },
  soccer: {
    key: 'soccer', label: 'Soccer', fullName: 'Premier League', region: 'Global',
    isActive: false,
    leagueId: 39,
    teamBase: 'football',
    leagueLogoUrl: 'https://media.api-sports.io/football/leagues/39.png',
    statLabels: {}, statUnits: {}, advancedMetrics: [], predNote: 'Coming soon.',
    showPitcherHand: false, showEnvironment: false,
  },
};

export const getTeamLogoUrl = (sport, teamId) => {
  if (!teamId || !SPORT_CONFIG[sport]) return null;
  return `https://media.api-sports.io/${SPORT_CONFIG[sport].teamBase}/teams/${teamId}.png`;
};

export const getLeagueLogoUrl = (sport) => SPORT_CONFIG[sport]?.leagueLogoUrl || null;
export const getStatLabel     = (sport, statType) => SPORT_CONFIG[sport]?.statLabels?.[statType] || statType;
export const getStatUnit      = (sport, statType) => SPORT_CONFIG[sport]?.statUnits?.[statType] || '';
export const getSportConfig   = (sport) => SPORT_CONFIG[sport] || SPORT_CONFIG.nba;
export const getActiveSports  = () => Object.values(SPORT_CONFIG).filter((s) => s.isActive);
export const getAllSports      = () => Object.values(SPORT_CONFIG);