// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme:        'dark',    // 'dark' | 'light'
  activeSport:  'nba',    // 'nba' | 'nfl' | 'mlb' | 'nhl' | 'soccer'
  activeFilter: 'all',    // 'all' | 'highConfidence' | 'bestValue'
  sidebarOpen:  false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('light', state.theme === 'light');
    },
    setTheme(state, { payload }) {
      state.theme = payload;
      document.documentElement.classList.toggle('light', payload === 'light');
    },
    setActiveSport(state, { payload }) {
      state.activeSport  = payload;
      state.activeFilter = 'all'; // always reset filter on sport change
    },
    resetFilter(state) {
      state.activeFilter = 'all';
    },
    setActiveFilter(state, { payload }) {
      state.activeFilter = payload;
    },
    setSidebarOpen(state, { payload }) {
      state.sidebarOpen = payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const {
  toggleTheme, setTheme,
  setActiveSport, setActiveFilter,
  setSidebarOpen, toggleSidebar,
  resetFilter,
} = uiSlice.actions;
export default uiSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────
export const selectTheme        = (s) => s.ui.theme;
export const selectActiveSport  = (s) => s.ui.activeSport;
export const selectActiveFilter = (s) => s.ui.activeFilter;
export const selectSidebarOpen  = (s) => s.ui.sidebarOpen;