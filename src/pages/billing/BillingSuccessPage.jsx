// src/pages/billing/BillingSuccessPage.jsx
//
// Post-checkout landing. Stripe hosted Checkout redirects here after a
// successful payment. Because credit granting happens via webhook (not
// this redirect), we poll the balance briefly to catch the increment,
// then show the confirmation UI.

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectCredits, getLoggedInUser } from '@/store/slices/authSlice';
import styles from './BillingPages.module.scss';

export default function BillingSuccessPage() {
  const dispatch = useDispatch();
  const credits  = useSelector(selectCredits);
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  const [pollingComplete, setPollingComplete] = useState(false);
  const [startBalance]                        = useState(credits);

  // Poll the server for balance updates for ~15s to catch the webhook
  // firing. If the balance changes, we stop polling early.
  useEffect(() => {
    document.title = 'Payment successful · EdgeAI';

    let cancelled = false;
    let attempts  = 0;
    const maxAttempts = 15;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        await dispatch(getLoggedInUser());
      } catch { /* silent */ }
      if (attempts >= maxAttempts) {
        setPollingComplete(true);
      } else {
        setTimeout(tick, 1000);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [dispatch]);

  useEffect(() => {
    if (credits > startBalance) {
      setPollingComplete(true);
    }
  }, [credits, startBalance]);

  const gained = Math.max(0, credits - startBalance);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className={styles.iconWrap}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        <h1 className={styles.title}>Payment successful</h1>

        {!pollingComplete && gained === 0 ? (
          <p className={styles.sub}>
            Adding credits to your wallet — this takes a few seconds…
          </p>
        ) : gained > 0 ? (
          <p className={styles.sub}>
            <strong className={styles.gained}>+{gained} credits</strong> added.
            Your new balance is <strong>{credits}</strong>.
          </p>
        ) : (
          <p className={styles.sub}>
            Credits will appear in your wallet within a minute. If they don't,
            refresh your wallet page or contact support.
          </p>
        )}

        {sessionId && (
          <p className={styles.reference}>
            Reference: <code>{sessionId.slice(-12)}</code>
          </p>
        )}

        <div className={styles.actions}>
          <Link to="/" className={styles.primaryBtn}>See today's slate</Link>
          <Link to="/wallet" className={styles.secondaryBtn}>View wallet</Link>
        </div>

        <p className={styles.fine}>
          A receipt has been sent to your email. Manage payment methods and
          view invoices from your wallet.
        </p>
      </motion.div>
    </div>
  );
}
