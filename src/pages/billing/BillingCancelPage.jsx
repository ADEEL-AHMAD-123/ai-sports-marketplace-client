// src/pages/billing/BillingCancelPage.jsx
//
// Landing when the user cancels Stripe Checkout. Friendly message, no
// blame. Offers clear paths back — try again or go home.

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './BillingPages.module.scss';

export default function BillingCancelPage() {
  useEffect(() => {
    document.title = 'Checkout cancelled · EdgeAI';
  }, []);

  return (
    <div className={styles.page}>
      <motion.div
        className={`${styles.card} ${styles.cardMuted}`}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={`${styles.iconWrap} ${styles.iconWrapMuted}`}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>

        <h1 className={styles.title}>Checkout cancelled</h1>
        <p className={styles.sub}>
          No charge was made. Your account is exactly where it was before.
        </p>

        <div className={styles.actions}>
          <Link to="/pricing" className={styles.primaryBtn}>Back to pricing</Link>
          <Link to="/" className={styles.secondaryBtn}>Go home</Link>
        </div>

        <p className={styles.fine}>
          Ran into a problem at checkout? Reply to any email from us or
          reach out from your <Link to="/wallet" className={styles.inlineLink}>wallet page</Link> — we'll help you sort it out.
        </p>
      </motion.div>
    </div>
  );
}
