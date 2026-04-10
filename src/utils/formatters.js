// utils/formatters.js — Shared formatting helpers

/**
 * Format a game start time from ISO string → "7:00 PM ET"
 */
export const formatGameTime = (isoString) => {
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '—';
  }
};

/**
 * Format a date → "Jan 15, 2024"
 */
export const formatDate = (isoString) => {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Format American odds for display.
 * Positive odds get a + prefix: 110 → "+110"
 * Negative odds stay as-is: -110 → "-110"
 */
export const formatOdds = (odds) => {
  if (odds == null) return '—';
  return odds > 0 ? `+${odds}` : `${odds}`;
};

/**
 * Format a credit delta for display in transaction history.
 * Positive → "+3", Negative → "-1"
 */
export const formatCreditDelta = (delta) => {
  return delta > 0 ? `+${delta}` : `${delta}`;
};

/**
 * Truncate long player names for mobile display.
 * "LeBron James" → "LeBron J." if over maxLen
 */
export const truncateName = (name, maxLen = 18) => {
  if (!name || name.length <= maxLen) return name;
  const parts = name.split(' ');
  if (parts.length < 2) return name.slice(0, maxLen);
  return `${parts[0]} ${parts[1][0]}.`;
};

/**
 * Get a color variable name based on confidence score.
 * Used for inline styles on confidence values.
 */
export const getConfidenceColor = (score) => {
  if (score >= 80) return 'var(--color-accent)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

/**
 * Get edge color — positive edge = OVER lean (green), negative = UNDER lean (red).
 */
export const getEdgeColor = (edge) => {
  return edge > 0 ? 'var(--color-accent)' : 'var(--color-danger)';
};