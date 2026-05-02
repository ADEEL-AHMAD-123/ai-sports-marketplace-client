// components/ui/EdgeMark.jsx
// Geometric E lettermark for Edge AI brand
// Usage: <EdgeMark size={18} color="var(--color-accent)" />
import React from 'react';

export default function EdgeMark({ size = 18, color = 'currentColor' }) {
  const u = size / 18; // scale unit
  return (
    <svg
      width={Math.round(16 * u)}
      height={Math.round(size)}
      viewBox="0 0 16 18"
      fill="none"
      aria-hidden="true"
    >
      {/* Top bar */}
      <rect x="0" y="1"  width="16" height="2.5" rx="1.25" fill={color} />
      {/* Mid bar — shorter, offset right for asymmetry */}
      <rect x="0" y="7.75" width="11" height="2.5" rx="1.25" fill={color} />
      {/* Bottom bar */}
      <rect x="0" y="14.5" width="16" height="2.5" rx="1.25" fill={color} />
    </svg>
  );
}