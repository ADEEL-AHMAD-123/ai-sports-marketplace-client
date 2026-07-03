// src/pages/PricingPage.jsx
//
// Public pricing page. Anyone can view it (including bots for SEO); a
// "Buy" click routes to /register for anonymous users and hits Stripe
// checkout for authenticated users.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { selectIsLoggedIn, selectToken, selectCredits } from '@/store/slices/authSlice';
import { CREDIT_PACKS_FALLBACK } from '@/constants/app';
import { createCheckoutSession, getErrorMsg } from '@/services/api';
import api from '@/services/api';
import styles from './PricingPage.module.scss';

export default function PricingPage() {
  const isLoggedIn  = useSelector(selectIsLoggedIn);
  const token       = useSelector(selectToken);
  const credits     = useSelector(selectCredits);
  const navigate    = useNavigate();

  const [packs, setPacks]           = useState(CREDIT_PACKS_FALLBACK);
  const [buyingPackId, setBuyingPackId] = useState(null);

  useEffect(() => {
    document.title = 'Pricing · EdgeAI — Credit Packs from $2.99';
    // Fetch fresh packs from server so any Stripe price update flows through
    // without a client rebuild.
    api.get('/credits/packs')
      .then((r) => { if (r.data?.packs?.length) setPacks(r.data.packs); })
      .catch(() => {}); // Fallback to hard-coded list on error.
  }, []);

  const handleBuy = async (packId) => {
    if (!isLoggedIn) {
      // Stash the intended pack so post-signup we can auto-redirect.
      sessionStorage.setItem('pendingPackId', packId);
      navigate('/register?next=/pricing');
      return;
    }
    setBuyingPackId(packId);
    try {
      const data = await createCheckoutSession(packId, token);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not start checkout.');
        setBuyingPackId(null);
      }
    } catch (err) {
      toast.error(getErrorMsg(err));
      setBuyingPackId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Pricing
          </div>
          <h1 className={styles.title}>Pay only for the picks you want</h1>
          <p className={styles.sub}>
            No subscription. No monthly minimums. Buy a pack of credits, unlock scouting reports one at a time.
            Credits never expire and each pack scales cheaper as it grows.
          </p>

          {isLoggedIn && (
            <div className={styles.balancePill}>
              <span className={styles.balDot} />
              Your balance: <strong>{credits}</strong> credit{credits === 1 ? '' : 's'}
            </div>
          )}
        </div>

        {/* Pricing grid */}
        <div className={styles.grid}>
          {packs.map((pack, i) => {
            const isHighlight = pack.highlight;
            const perCredit   = pack.perCredit ?? (pack.credits > 0 ? pack.amount / pack.credits : 0);
            const savePct     = pack.save ?? 0;
            const busy        = buyingPackId === pack.id;

            return (
              <motion.div
                key={pack.id}
                className={`${styles.card} ${isHighlight ? styles.cardHighlight : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {isHighlight && <div className={styles.badge}>Most popular</div>}

                <div className={styles.packLabel}>{pack.label}</div>
                <div className={styles.packDesc}>{pack.description || '—'}</div>

                <div className={styles.priceRow}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>{pack.amount}</span>
                </div>

                <div className={styles.creditsRow}>
                  <strong>{pack.credits}</strong> credit{pack.credits === 1 ? '' : 's'}
                  <span className={styles.sep}>·</span>
                  ${perCredit.toFixed(2)} each
                </div>

                {savePct > 0 ? (
                  <div className={styles.saveTag}>Save {savePct}%</div>
                ) : (
                  <div className={styles.saveTagPlaceholder} aria-hidden="true" />
                )}

                <button
                  className={`${styles.buyBtn} ${isHighlight ? styles.buyBtnHighlight : ''}`}
                  onClick={() => handleBuy(pack.id)}
                  disabled={busy}
                  type="button"
                >
                  {busy ? (
                    <span className={styles.spinner} aria-label="Loading" />
                  ) : isLoggedIn ? (
                    'Buy now'
                  ) : (
                    'Sign up + buy'
                  )}
                </button>

                <div className={styles.perkList}>
                  <div className={styles.perk}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    1 credit unlocks 1 report
                  </div>
                  <div className={styles.perk}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Credits never expire
                  </div>
                  <div className={styles.perk}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Auto-refund on AI failure
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <section className={styles.faq}>
          <h2 className={styles.faqTitle}>Frequently asked</h2>

          <details className={styles.faqItem}>
            <summary>What's a credit?</summary>
            <p>A credit unlocks one AI scouting report for a specific player prop — the recommendation, model edge, confidence, matchup analysis, and reasoning. One credit, one report.</p>
          </details>

          <details className={styles.faqItem}>
            <summary>Do credits expire?</summary>
            <p>No. Buy them today, use them next week or next season — they sit in your wallet indefinitely.</p>
          </details>

          <details className={styles.faqItem}>
            <summary>What if the AI fails or the prop closes?</summary>
            <p>Automatic refund. If our AI can't generate a report or the prop is no longer available at your book, your credit is returned to your wallet immediately.</p>
          </details>

          <details className={styles.faqItem}>
            <summary>Can I get a refund on unused credits?</summary>
            <p>Yes — within 2 hours of purchase, self-serve from your wallet. Beyond that window, contact support and we'll review case by case.</p>
          </details>

          <details className={styles.faqItem}>
            <summary>Is this a subscription?</summary>
            <p>No. One-time credit packs only. Pay when you want more, skip the months you don't.</p>
          </details>

          <details className={styles.faqItem}>
            <summary>What payment methods do you accept?</summary>
            <p>All major credit cards (Visa, Mastercard, Amex, Discover), Apple Pay, Google Pay, and Link. Payments are processed securely by Stripe — we never see your card number.</p>
          </details>
        </section>

        {/* Trust footer */}
        <div className={styles.trust}>
          <div className={styles.trustLine}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Secure payment via Stripe. We never store your card details.</span>
          </div>
          <p className={styles.trustFine}>
            AI-powered scouting to help you make more informed picks. No outcome is guaranteed.
            Verify current lines at your sportsbook before wagering, and only stake what you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
}
