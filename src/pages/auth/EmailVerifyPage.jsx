// src/pages/auth/EmailVerifyPage.jsx
//
// Landing page from the verification email link. Hits the backend to
// exchange the token for a verified account, refreshes the Redux user
// so the frontend sees isEmailVerified + new credit balance, then
// offers a CTA to continue.

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { getLoggedInUser } from '@/store/slices/authSlice';
import api from '@/services/api';
import { getErrorMsg } from '@/services/api';
import styles from './EmailVerifyPage.module.scss';

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const token    = params.get('token');

  const [state, setState]     = useState('verifying'); // 'verifying' | 'ok' | 'already' | 'error'
  const [credits, setCredits] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    document.title = 'Verify email · EdgeAI';

    if (!token) {
      setState('error');
      setError('Missing verification token in the link.');
      return;
    }

    (async () => {
      try {
        const res = await api.get(`/auth/verify-email`, { params: { token } });
        if (res.data?.alreadyVerified) {
          setState('already');
        } else {
          setState('ok');
          if (typeof res.data?.credits === 'number') setCredits(res.data.credits);
        }
        // Refresh Redux user so the app knows the account is now verified.
        try { await dispatch(getLoggedInUser()); } catch { /* no-op */ }
      } catch (err) {
        setState('error');
        setError(getErrorMsg(err));
      }
    })();
  }, [token, dispatch]);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {state === 'verifying' && (
          <>
            <div className={styles.iconWrap}>
              <span className={styles.spinner} aria-label="Verifying" />
            </div>
            <h1 className={styles.title}>Verifying your email…</h1>
            <p className={styles.sub}>One moment while we activate your account.</p>
          </>
        )}

        {state === 'ok' && (
          <>
            <div className={`${styles.iconWrap} ${styles.iconWrapOk}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className={styles.title}>You're all set.</h1>
            <p className={styles.sub}>
              Your email is verified.{' '}
              {credits !== null && (
                <>You now have <strong className={styles.gained}>{credits} credits</strong> ready to use.</>
              )}
            </p>
            <div className={styles.actions}>
              <Link to="/" className={styles.primaryBtn}>See today's slate</Link>
              <Link to="/wallet" className={styles.secondaryBtn}>View wallet</Link>
            </div>
          </>
        )}

        {state === 'already' && (
          <>
            <div className={`${styles.iconWrap} ${styles.iconWrapOk}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className={styles.title}>Already verified.</h1>
            <p className={styles.sub}>This email address has been verified before. You're good to go.</p>
            <div className={styles.actions}>
              <Link to="/" className={styles.primaryBtn}>Continue to EdgeAI</Link>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className={`${styles.iconWrap} ${styles.iconWrapError}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className={styles.title}>We couldn't verify this link.</h1>
            <p className={styles.sub}>{error || 'The link is invalid or has expired.'}</p>
            <div className={styles.actions}>
              <Link to="/login" className={styles.primaryBtn}>Log in</Link>
              <Link to="/register" className={styles.secondaryBtn}>Create account</Link>
            </div>
            <p className={styles.fine}>
              Already have an account? Log in and hit "Resend verification email" from the wallet page.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
