// utils/formatters.js — Shared formatting helpers.
//
// ─── Time & date rendering policy ─────────────────────────────────────────
// Every game time renderer in the app funnels through these helpers so we
// have ONE place that owns the timezone rule. The rule is:
//
//   Render every game date + time in the VIEWER'S local browser timezone,
//   never in a fixed US-market zone. A user in Karachi sees "Sun, Aug 2 ·
//   4:30 AM PKT"; a user in LA sees "Sat, Aug 1 · 4:30 PM PDT"; a user in
//   New York sees "Sat, Aug 1 · 7:30 PM EDT" — all for the same event.
//
// Why not force a fixed US zone? Two prior bugs came from mixing zones:
//   (1) Date rendered in browser-local + time rendered in America/New_York
//       gave a day/time mismatch for anyone east of NYC (a Sat 7:30 PM EDT
//       game read "Sun · 7:30 PM EDT" in Pakistan).
//   (2) Even when consistent, "7:30 PM EDT" is meaningless to a global
//       user who has to do timezone math to know when to watch.
//
// Invariants every caller relies on:
//   • No `timeZone` option is set anywhere → both date and time follow the
//     browser's system zone. They CANNOT drift apart.
//   • `timeZoneName: 'short'` on time strings so the viewer sees THEIR zone
//     abbreviation (EDT/PST/PKT/BST/…) and knows the label matches reality.
//   • Today/Tomorrow/Yesterday helpers compare day boundaries in the same
//     browser-local zone, so "Today" means what the viewer's calendar says
//     is today.

/**
 * Format a game start time → "7:00 PM EDT" (in the viewer's local timezone).
 */
export const formatGameTime = (isoString) => {
  try {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '—';
  }
};

/**
 * Format a game start date → "Sat, Aug 1" (in the viewer's local timezone).
 * Kept separate from time so callers can render on two lines.
 */
export const formatGameDate = (isoString, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => {
  try {
    return new Date(isoString).toLocaleDateString(undefined, opts);
  } catch {
    return '—';
  }
};

/**
 * Number of calendar days between a game and now, evaluated in the
 * viewer's local timezone. Returns:
 *   0  → game is today
 *   1  → tomorrow
 *  -1  → yesterday
 *   N  → N days away
 * Used to produce Today/Tomorrow/Yesterday labels consistently.
 */
export const localDayDiff = (isoString) => {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  const now  = new Date();
  const midD = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
  const midN = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((midD - midN) / 86400000);
};

/**
 * Format a date → "Jan 15, 2024" (viewer's local timezone).
 */
export const formatDate = (isoString) => {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
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