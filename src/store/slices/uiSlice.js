// store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'dark',                  // 'dark' | 'light'
    activeSport: 'nba',
    activeFilter: 'all',            // 'all' | 'highConfidence' | 'bestValue'
    pendingInsightRequest: null,    // saved before login redirect
    sidebarOpen: false,             // admin sidebar on mobile
  },
  reducers: {
    setTheme(state, { payload }) {
      state.theme = payload;
      // Sync to <html> class
      document.documentElement.classList.toggle('light', payload === 'light');
    },
    toggleTheme(state) {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = next;
      document.documentElement.classList.toggle('light', next === 'light');
    },
    setActiveSport(state, { payload }) {
      state.activeSport = payload;
    },
    setActiveFilter(state, { payload }) {
      state.activeFilter = payload;
    },
    setPendingInsightRequest(state, { payload }) {
      state.pendingInsightRequest = payload;
    },
    clearPendingInsightRequest(state) {
      state.pendingInsightRequest = null;
    },
    setSidebarOpen(state, { payload }) {
      state.sidebarOpen = payload;
    },
  },
});

export const {
  setTheme, toggleTheme,
  setActiveSport, setActiveFilter,
  setPendingInsightRequest, clearPendingInsightRequest,
  setSidebarOpen,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme        = (s) => s.ui.theme;
export const selectActiveSport  = (s) => s.ui.activeSport;
export const selectActiveFilter = (s) => s.ui.activeFilter;
export const selectPending      = (s) => s.ui.pendingInsightRequest;
export const selectSidebarOpen  = (s) => s.ui.sidebarOpen;