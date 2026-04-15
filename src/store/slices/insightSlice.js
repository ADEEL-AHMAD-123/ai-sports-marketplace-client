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

  // Per-prop unlocking state — keyed by same composite key
  // This prevents ALL cards showing spinner when one is loading
  unlockingKeys:  {},
  unlockErrors:   {},

  recentInsights: [],
  recentLoading:  false,
  recentError:    null,
};

const buildInsightKey = ({ playerName, statType, eventId, oddsEventId }) => {
  const resolvedEventId = eventId ?? oddsEventId;
  if (!playerName || !statType || !resolvedEventId) return null;
  return `${playerName}_${statType}_${resolvedEventId}`;
};

const insightSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    clearUnlockError(state) { state.unlockError = null; },
    cacheInsight(state, { payload }) {
      const key = buildInsightKey(payload || {});
      if (key) state.unlockedInsights[key] = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(unlockInsight.pending, (state, { meta }) => {
        // Only mark THIS specific prop as loading — not all of them
        const { playerName, statType, eventId } = meta.arg.data || {};
        const key = buildInsightKey({ playerName, statType, eventId });
        if (key) {
          state.unlockingKeys[key] = true;
          delete state.unlockErrors[key];
        }
      })
      .addCase(unlockInsight.rejected, (state, { payload, meta }) => {
        const { playerName, statType, eventId } = meta.arg.data || {};
        const key = buildInsightKey({ playerName, statType, eventId });
        if (key) {
          state.unlockingKeys[key] = false;
          state.unlockErrors[key]  = payload?.message || 'Failed to unlock';
        }
      })
      .addCase(unlockInsight.fulfilled, (state, { payload, meta }) => {
        const { playerName, statType, eventId } = meta.arg.data || {};
        const key = buildInsightKey({ playerName, statType, eventId });
        if (key) {
          state.unlockingKeys[key] = false;
          delete state.unlockErrors[key];
        }
        // Store the insight — keyed so PropCard can find it
        const insight = payload?.insight;
        if (insight) {
          const insightKey = buildInsightKey(insight);
          if (insightKey) state.unlockedInsights[insightKey] = insight;
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
// Per-prop selectors — pass the composite key
export const selectIsUnlockingKey = (key) => (s) => !!s.insights.unlockingKeys[key];
export const selectUnlockErrorKey = (key) => (s) => s.insights.unlockErrors[key] || null;
export const selectRecentInsights = (s) => s.insights.recentInsights;
export const selectRecentLoading  = (s) => s.insights.recentLoading;