// src/hooks/useOdds.js
//
// ARCHITECTURE:
//  - Backend is the single source of truth
//  - Backend caches with Redis (avoids over-calling third-party APIs)
//  - Frontend NEVER caches odds/props — always fetches fresh on mount
//  - Redux store holds data only for the current session (not persisted)
//  - On page refresh: Redux clears → fresh fetch from backend → backend serves from Redis or DB

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGames, fetchProps,
  clearGamesForSport, clearPropsForEvent,
  selectGamesLoading, selectGamesError,
  selectPropsLoading, selectPropsError,
} from '@/store/slices/oddsSlice';
import { selectActiveSport, selectActiveFilter } from '@/store/slices/uiSlice';

// Stable empty arrays — never creates new [] references on each render
const EMPTY = [];

/**
 * useOdds()
 * Always fetches fresh from backend when sport changes.
 * Backend serves from Redis cache (fast) or DB — frontend doesn't need to cache.
 */
export function useOdds() {
  const dispatch    = useDispatch();
  const activeSport = useSelector(selectActiveSport);
  const isLoading   = useSelector(selectGamesLoading);
  const error       = useSelector(selectGamesError);
  const games       = useSelector((s) => s.odds.gamesBySport[activeSport] ?? EMPTY);

  useEffect(() => {
    // Always clear Redux + re-fetch when sport changes
    // Backend Redis cache handles deduplication — we don't need to in frontend
    dispatch(clearGamesForSport(activeSport));
    dispatch(fetchGames({ sport: activeSport }));
  }, [activeSport]);

  const refresh = () => {
    dispatch(clearGamesForSport(activeSport));
    dispatch(fetchGames({ sport: activeSport }));
  };

  return { games, isLoading, error, refresh, sport: activeSport };
}

/**
 * useProps(sport, eventId)
 * Always fetches fresh from backend when eventId or filter changes.
 */
export function useProps(sport, eventId) {
  const dispatch     = useDispatch();
  const activeFilter = useSelector(selectActiveFilter);
  const isLoading    = useSelector(selectPropsLoading);
  const error        = useSelector(selectPropsError);
  const props        = useSelector((s) => s.odds.propsByEvent[eventId] ?? EMPTY);

  const load = () => {
    dispatch(fetchProps({
      sport,
      eventId,
      params: activeFilter !== 'all' ? { filter: activeFilter } : {},
    }));
  };

  useEffect(() => {
    // Always re-fetch — backend Redis cache is fast, no need to skip
    dispatch(clearPropsForEvent(eventId));
    load();
  }, [sport, eventId, activeFilter]);

  const refresh = () => {
    dispatch(clearPropsForEvent(eventId));
    load();
  };

  return { props, isLoading, error, refresh, activeFilter };
}