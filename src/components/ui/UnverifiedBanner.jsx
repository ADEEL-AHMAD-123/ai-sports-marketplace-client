// src/components/ui/UnverifiedBanner.jsx
//
// Rendered on any page where an unverified user needs a nudge to check
// their inbox. Uses the app's card design tokens so it matches every
// other panel in the wallet / account UI and adapts to light+dark themes.

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectUser } from '@/store/slices/authSlice';
import api, { getErrorMsg } from '@/services/api';
import styles from './UnverifiedBanner.module.scss';

export default function UnverifiedBanner({ compact = false }) {
  const user = useSelector(selectUser);
  const [sending, setSending] = useState(false);
  const [sentAt,  setSentAt]  = useState(0);

  if (!user || user.isEmailVerified) return null;

  // 60-second cooldown UI mirrors the server's per-user cooldown so the
  // button doesn't visually invite spam-clicking.
  const secondsSinceSent = sentAt ? Math.floor((Date.now() - sentAt) / 1000) : Infinity;
  const cooldownLeft     = Math.max(0, 60 - secondsSinceSent);

  const handleResend = async () => {
    if (cooldownLeft > 0 || sending) return;
    setSending(true);
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      toast.success('Verification email sent. Check your inbox.');
      setSentAt(Date.now());
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${styles.banner} ${compact ? styles.compact : ''}`} role="alert">
      <div className={styles.iconWrap} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>

      <div className={styles.text}>
        <strong>Verify your email to unlock free credits</strong>
        {!compact && (
          <span>Check your inbox for the verification link. Insights and purchases stay locked until you confirm.</span>
        )}
      </div>

      <button
        className={styles.action}
        onClick={handleResend}
        disabled={sending || cooldownLeft > 0}
        type="button"
      >
        {sending ? 'Sending…' : cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : 'Resend email'}
      </button>
    </div>
  );
}
