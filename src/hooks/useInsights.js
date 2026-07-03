// src/hooks/useInsights.js
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  unlockInsight, fetchRecentInsights,
  selectIsUnlockingKey,
  selectBlockedInsightKey,
  selectRecentInsights, selectRecentLoading,
  clearBlockedInsight,
} from '@/store/slices/insightSlice';
import { fetchProps } from '@/store/slices/oddsSlice';
import { selectActiveFilter } from '@/store/slices/uiSlice';
import { setCredits, selectCredits, selectIsLoggedIn } from '@/store/slices/authSlice';

const NULL = null;

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const buildInsightKey = ({ playerName, statType, eventId, oddsEventId }) => {
  const resolvedEventId = eventId ?? oddsEventId;
  return `${playerName}_${statType}_${resolvedEventId}`;
};

export function useUnlock(prop, sport) {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const credits    = useSelector(selectCredits);
  const activeFilter = useSelector(selectActiveFilter);

  const key = buildInsightKey({
    playerName: prop.playerName,
    statType: prop.statType,
    eventId: prop.eventId,
    oddsEventId: prop.oddsEventId,
  });

  // Per-prop loading — ONLY this card shows spinner
  const isUnlocking = useSelector(selectIsUnlockingKey(key));
  const blockedInfo = useSelector(selectBlockedInsightKey(key));

  // Check if already unlocked
  const insight = useSelector((s) => s.insights.unlockedInsights[key] ?? NULL);
  const isUnlocked = !!insight;

  const refreshProps = () => {
    dispatch(clearBlockedInsight(key));
    dispatch(fetchProps({
      sport,
      eventId: prop.oddsEventId,
      params: activeFilter !== 'all' ? { filter: activeFilter } : {},
    }));
  };

  const attemptUnlock = (line) => dispatch(unlockInsight({
    data: {
      sport,
      eventId:     prop.oddsEventId,
      playerName:  prop.playerName,
      statType:    prop.statType,
      bettingLine: line,
      marketType:  'player_prop',
    },
  }));

  // Silently pull fresh lines from bookies, then re-sync props into state.
  // Best-effort: a cooldown (429) or any failure is swallowed — the unlock
  // retry still proceeds with the server-reported current line. The user
  // never sees this happen; there is no manual refresh step.
  const silentLineRefresh = async () => {
    try {
      await fetch(`${API_BASE}/odds/${sport}/games/${prop.oddsEventId}/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
    } catch {
      /* ignore — best-effort */
    }
    refreshProps();
  };

  const unlock = async () => {
    // Already unlocked — return immediately so modal opens
    if (isUnlocked && insight) return { success: true, alreadyUnlocked: true };

    if (!isLoggedIn) {
      toast.error('Please log in to unlock insights.');
      return { success: false };
    }
    if (credits < 1) {
      toast.error('Not enough credits. Buy more in your wallet.');
      return { success: false };
    }

    let result = await attemptUnlock(prop.line);

    // Odds moved while unlocking — refresh from bookies and retry once,
    // transparently. The user is never asked to click a refresh button.
    const oddsMoved =
      (unlockInsight.rejected.match(result)  && result.payload?.status === 409) ||
      (unlockInsight.fulfilled.match(result) && result.payload?.preflightFailed);

    if (oddsMoved) {
      const serverLine = result.payload?.currentLine;
      await silentLineRefresh();
      const retryLine = typeof serverLine === 'number' ? serverLine : prop.line;
      result = await attemptUnlock(retryLine);
    }

    if (unlockInsight.fulfilled.match(result)) {
      const payload = result.payload;

      // Update credit balance from server response
      if (payload?.remainingCredits != null) {
        dispatch(setCredits(payload.remainingCredits));
      } else if (payload?.creditDeducted) {
        dispatch(setCredits(Math.max(0, credits - 1)));
      }

      // Still blocked after the silent refresh + retry — soft, neutral note.
      if (payload?.preflightFailed) {
        toast('Odds are updating — give it a moment and try again.', { icon: '↻' });
        refreshProps();
        return { success: false };
      }

      // creditDeducted:false now only happens when the user re-opens their
      // own previously-unlocked insight — so the copy makes that explicit.
      toast.success(payload?.creditDeducted
        ? 'Insight unlocked! 1 credit used.'
        : 'You already unlocked this one — no charge.');
      // No props re-fetch here — the unlock state lives in Redux and the card
      // re-renders from it. Re-fetching the whole list caused a skeleton flash
      // that looked like a page refresh. (The odds-moved path above already
      // re-synced via silentLineRefresh when the line actually changed.)
      dispatch(clearBlockedInsight(key));
      return { success: true };
    }

    // Rejected
    const status     = result.payload?.status;
    const injuryInfo = result.payload?.details?.injuryInfo || result.payload?.injuryInfo;
    if (status === 402) {
      toast.error('Not enough credits.');
    } else if (status === 422 && injuryInfo?.skip) {
      const fallback = injuryInfo?.reason
        ? `Player unavailable (${injuryInfo.reason}). Insight not generated.`
        : 'Player unavailable. Insight not generated.';
      toast.error(result.payload?.message || fallback);
    } else if (status === 409) {
      // Odds still moving after the silent refresh + retry — soft, neutral.
      toast('Odds are updating — give it a moment and try again.', { icon: '↻' });
      refreshProps();
    } else {
      toast.error(result.payload?.message || 'Failed to unlock insight.');
    }
    return { success: false };
  };

  return {
    unlock,
    isUnlocking,  // Only true for THIS prop
    isUnlocked,
    insight,
    blockedInfo,
    isInjuryBlocked: !!blockedInfo?.skip,
    canUnlock: isLoggedIn && credits >= 1,
    refreshProps,
  };
}

export function useScoutLog() {
  const dispatch       = useDispatch();
  const recentInsights = useSelector(selectRecentInsights);
  const isLoading      = useSelector(selectRecentLoading);
  const load = () => dispatch(fetchRecentInsights({ params: { limit: 5, sort: '-createdAt' } }));
  return { recentInsights, isLoading, load };
}