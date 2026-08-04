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

  // The former silentLineRefresh() has been removed to conserve Odds API
  // quota. Every 409 during unlock used to trigger a full /refresh call
  // (30-50 credits per game) invisibly. The scheduled prop-watcher picks
  // up moved lines within 15 minutes anyway, and the "odds moved" toast
  // below tells the user to retry once the DB catches up. If a user is
  // desperate to force a refresh, that's an admin-only operation.

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

    // Odds moved during the unlock. Instead of the old silent refresh (which
    // hit /refresh and spent Odds API credits every time), we retry ONCE
    // with the server-reported current line. If that also 409s, the toast
    // below tells the user to wait for the next scheduled prop-watcher run.
    const oddsMoved =
      (unlockInsight.rejected.match(result)  && result.payload?.status === 409) ||
      (unlockInsight.fulfilled.match(result) && result.payload?.preflightFailed);

    if (oddsMoved) {
      const serverLine = result.payload?.currentLine;
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

      // Still blocked after the single retry with the server line — soft,
      // neutral note. The scheduled prop-watcher will refresh the DB line
      // within 15 minutes; asking the user to retry then costs zero credits.
      if (payload?.preflightFailed) {
        toast('Odds are updating — give it a minute and try again.', { icon: '↻' });
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
      // that looked like a page refresh.
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