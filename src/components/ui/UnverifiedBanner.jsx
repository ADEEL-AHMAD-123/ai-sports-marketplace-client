// src/components/ui/UnverifiedBanner.jsx
//
// Small persistent banner that appears whenever the current user's email
// hasn't been verified yet. Includes a "Resend email" action with
// inline success/error feedback and a per-user cooldown UI so users
// don't spam-click.

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

  // No user or already verified → don't render.
  if (!user || user.isEmailVerified) return null;

  // 60s cooldown mirrors the server rule.
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
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
      <div className={styles.text}>
        <strong>Verify your email</strong>
        {!compact && (
          <span> — check your inbox for the link. Your free credits and unlocks activate once verified.</span>
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
