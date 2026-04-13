// src/store/slices/insightSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { createApiThunk } from '@/utils/apiHelper';

export const unlockInsight = createApiThunk({
  typePrefix: 'insights/unlock',
  method: 'POST',
  url: '/insights/unlock',
});

export const fetchRecentInsights = createApiThunk({
  typePrefix: 'insights/fetchRecent',
  method: 'GET',
  url: '/insights',
});

const initialState = {
  // Keyed by `${playerName}_${statType}_${oddsEventId}`
  unlockedInsights: {},
  unlocking:        false,
  unlockError:      null,

  recentInsights: [],
  recentLoading:  false,
  recentError:    null,
};

const insightSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    clearUnlockError(state) { state.unlockError = null; },
    cacheInsight(state, { payload }) {
      const key = `${payload.playerName}_${payload.statType}_${payload.oddsEventId}`;
      state.unlockedInsights[key] = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(unlockInsight.pending, (state) => {
        state.unlocking   = true;
        state.unlockError = null;
      })
      .addCase(unlockInsight.rejected, (state, { payload }) => {
        state.unlocking   = false;
        state.unlockError = payload?.message || 'Failed to unlock insight';
      })
      .addCase(unlockInsight.fulfilled, (state, { payload }) => {
        state.unlocking = false;
        // Backend returns: { success, message, creditDeducted, remainingCredits, insight }
        const insight = payload?.insight;
        if (insight) {
          const key = `${insight.playerName}_${insight.statType}_${insight.oddsEventId}`;
          state.unlockedInsights[key] = insight;
        }
      })

      .addCase(fetchRecentInsights.pending,   (state) => { state.recentLoading = true;  state.recentError = null; })
      .addCase(fetchRecentInsights.rejected,  (state, { payload }) => { state.recentLoading = false; state.recentError = payload?.message || 'Failed to load'; })
      .addCase(fetchRecentInsights.fulfilled, (state, { payload }) => {
        state.recentLoading  = false;
        // Backend returns: { success, insights: [...] } or { data: [...] }
        state.recentInsights = payload?.insights ?? payload?.data ?? [];
      });
  },
});

export const { clearUnlockError, cacheInsight } = insightSlice.actions;
export default insightSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────
export const selectUnlocking      = (s) => s.insights.unlocking;
export const selectUnlockError    = (s) => s.insights.unlockError;
export const selectRecentInsights = (s) => s.insights.recentInsights;
export const selectRecentLoading  = (s) => s.insights.recentLoading;