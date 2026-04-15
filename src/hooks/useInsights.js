// src/hooks/useInsights.js
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  unlockInsight, fetchRecentInsights,
  selectIsUnlockingKey,
  selectRecentInsights, selectRecentLoading,
} from '@/store/slices/insightSlice';
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

  const key = buildInsightKey({
    playerName: prop.playerName,
    statType: prop.statType,
    eventId: prop.eventId,
    oddsEventId: prop.oddsEventId,
  });

  // Per-prop loading — ONLY this card shows spinner
  const isUnlocking = useSelector(selectIsUnlockingKey(key));

  // Check if already unlocked
  const insight = useSelector((s) => s.insights.unlockedInsights[key] ?? NULL);
  const isUnlocked = !!insight;

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

    const result = await dispatch(unlockInsight({
      data: {
        sport,
        eventId:     prop.oddsEventId,
        playerName:  prop.playerName,
        statType:    prop.statType,
        bettingLine: prop.line,
        marketType:  'player_prop',
      },
    }));

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

      return { success: true };
    } else {
      const status = result.payload?.status;
      if (status === 402)      toast.error('Not enough credits.');
      else if (status === 409) toast.error('Odds shifted. Please refresh.');
      else                     toast.error(result.payload?.message || 'Failed to unlock insight.');
      return { success: false };
    }
  };

  return {
    unlock,
    isUnlocking,  // Only true for THIS prop
    isUnlocked,
    insight,
    canUnlock: isLoggedIn && credits >= 1,
  };
}

export function useScoutLog() {
  const dispatch       = useDispatch();
  const recentInsights = useSelector(selectRecentInsights);
  const isLoading      = useSelector(selectRecentLoading);
  const load = () => dispatch(fetchRecentInsights({ params: { limit: 5, sort: '-createdAt' } }));
  return { recentInsights, isLoading, load };
}