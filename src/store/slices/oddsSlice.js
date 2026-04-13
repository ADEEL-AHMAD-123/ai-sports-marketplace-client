// src/store/slices/oddsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { createApiThunk } from '@/utils/apiHelper';

export const fetchGames = createApiThunk({
  typePrefix: 'odds/fetchGames',
  method: 'GET',
  url: ({ sport }) => `/odds/${sport}/games`,
});

export const fetchProps = createApiThunk({
  typePrefix: 'odds/fetchProps',
  method: 'GET',
  url: ({ sport, eventId }) => `/odds/${sport}/games/${eventId}/props`,
});

const initialState = {
  gamesBySport: {},
  gamesLoading: false,
  gamesError:   null,
  propsByEvent: {},
  propsLoading: false,
  propsError:   null,
};

const oddsSlice = createSlice({
  name: 'odds',
  initialState,
  reducers: {
    clearPropsForEvent(state, { payload: eventId }) {
      delete state.propsByEvent[eventId];
    },
    clearGamesForSport(state, { payload: sport }) {
      delete state.gamesBySport[sport];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending,   (state) => { state.gamesLoading = true;  state.gamesError = null; })
      .addCase(fetchGames.rejected,  (state, { payload }) => { state.gamesLoading = false; state.gamesError = payload?.message || 'Failed to load games'; })
      .addCase(fetchGames.fulfilled, (state, { payload, meta }) => {
        state.gamesLoading = false;
        state.gamesBySport[meta.arg.sport] = payload.data ?? payload;
      })
      .addCase(fetchProps.pending,   (state) => { state.propsLoading = true;  state.propsError = null; })
      .addCase(fetchProps.rejected,  (state, { payload }) => { state.propsLoading = false; state.propsError = payload?.message || 'Failed to load props'; })
      .addCase(fetchProps.fulfilled, (state, { payload, meta }) => {
        state.propsLoading = false;
        state.propsByEvent[meta.arg.eventId] = payload.data ?? payload;
      });
  },
});

export const { clearPropsForEvent, clearGamesForSport } = oddsSlice.actions;
export default oddsSlice.reducer;

// ── Simple primitive selectors — no array creation, no memoization needed ──
export const selectGamesLoading = (s) => s.odds.gamesLoading;
export const selectGamesError   = (s) => s.odds.gamesError;
export const selectPropsLoading = (s) => s.odds.propsLoading;
export const selectPropsError   = (s) => s.odds.propsError;

// NOTE: selectGamesBySport and selectPropsByEvent are intentionally NOT here.
// They're inline in useOdds.js with a stable EMPTY constant to avoid
// creating new array references on every render.