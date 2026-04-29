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

    // If the line moved, auto-retry once with the latest line from server.
    if (unlockInsight.rejected.match(result) && result.payload?.status === 409) {
      const currentLine = result.payload?.currentLine;
      if (typeof currentLine === 'number' && currentLine !== prop.line) {
        toast('Line moved. Retrying with latest odds...', { icon: '↻' });
        result = await attemptUnlock(currentLine);
      }
    }

    if (unlockInsight.fulfilled.match(result)) {
      const payload = result.payload;

      // Update credit balance from server response
      if (payload?.remainingCredits != null) {
        dispatch(setCredits(payload.remainingCredits));
      } else if (payload?.creditDeducted) {
        dispatch(setCredits(Math.max(0, credits - 1)));
      }

      if (payload?.preflightFailed) {
        toast.error(payload.message || 'Odds shifted — please refresh.');
        return { success: false };
      }

      if (payload?.creditDeducted) {
        toast.success('Insight unlocked! 1 credit used.');
      } else {
        toast.success('Retrieved from cache — no credit used.');
      }

      refreshProps();

      return { success: true };
    } else {
      const status = result.payload?.status;
      const injuryInfo = result.payload?.details?.injuryInfo || result.payload?.injuryInfo;
      if (status === 402)      toast.error('Not enough credits.');
      else if (status === 422 && injuryInfo?.skip) {
        const fallback = injuryInfo?.reason
          ? `Player unavailable (${injuryInfo.reason}). Insight not generated.`
          : 'Player unavailable. Insight not generated.';
        toast.error(result.payload?.message || fallback);
      }
      else if (status === 409) {
        toast.error('Odds moved too fast. We refreshed lines for you — try once more.');
        refreshProps();
      } else {
        toast.error(result.payload?.message || 'Failed to unlock insight.');
      }
      return { success: false };
    }
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