// src/pages/user/WalletPage.jsx
//
// Authenticated user wallet. Full lifecycle:
//  - Current balance + spend summary
//  - Credit packs grid (with highlight badge, save %, description)
//  - Transaction history with self-serve refund per eligible PURCHASE
//  - "Manage billing" button → opens Stripe hosted portal in same tab
//
// All logic lives in useWallet; this file is purely presentation.

import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import {
  TRANSACTION_TYPE_LABELS,
  REFUND_SELF_SERVE_WINDOW_HOURS,
} from '@/constants/app';
import { Skeleton } from '@/components/ui/Skeleton';
import UnverifiedBanner from '@/components/ui/UnverifiedBanner';
import styles from './WalletPage.module.scss';

// ── Refund eligibility ─────────────────────────────────────────
// Mirror of the server-side rule. Even if this is wrong (client clock
// skew, etc.), the server enforces the real check — this just hides the
// button when we know it'd be denied.
const isRefundEligible = (tx) => {
  if (tx.type !== 'purchase') return false;
  if (!tx.stripe?.paymentIntentId) return false;
  const hoursSince = (Date.now() - new Date(tx.createdAt).getTime()) / 3_600_000;
  return hoursSince <= REFUND_SELF_SERVE_WINDOW_HOURS;
};

// Format a per-transaction description helpfully. Server sends "Purchased
// 25 Credits (25 credits) via Stripe" etc. Some transactions have no
// description, so we fall back to the type label.
const displayDesc = (tx) => tx.description || TRANSACTION_TYPE_LABELS[tx.type] || tx.type;

export default function WalletPage() {
  const {
    credits,
    packs, isLoadingPacks,
    transactions, isLoadingTx,
    pages, page, setPage,
    summary, isLoadingSummary,
    buyPack, isCheckingOut,
    openPortal, isOpeningPortal,
    refundTransaction, refundingTxId,
  } = useWallet();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Wallet</h1>

        <UnverifiedBanner />

        {/* ── Balance card ────────────────────────────── */}
        <div className={styles.balanceCard}>
          <div>
            <p className={styles.balLabel}>Current balance</p>
            <div className={styles.balValue}>
              <span className={styles.balIcon}>◈</span>
              <span className={styles.balNum}>{credits}</span>
            </div>
            <p className={styles.balSub}>credits available</p>
          </div>
          <div className={styles.balInfo}>
            <div className={styles.balFact}><span>◈</span>1 credit = 1 AI scouting report</div>
            <div className={styles.balFact}><span>∞</span>Credits never expire</div>
            <div className={styles.balFact}><span>↩</span>Auto-refund if AI fails</div>
          </div>
        </div>

        {/* ── Spend summary (lifetime stats) ─────────── */}
        {summary && !isLoadingSummary && summary.totalCreditsPurchased > 0 && (
          <div className={styles.summaryRow}>
            <div className={styles.summaryStat}>
              <span className={styles.summaryVal}>${summary.totalSpentUSD.toFixed(2)}</span>
              <span className={styles.summaryLbl}>Lifetime spend</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.summaryVal}>{summary.totalCreditsPurchased}</span>
              <span className={styles.summaryLbl}>Credits purchased</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.summaryVal}>{summary.totalInsightsUnlocked}</span>
              <span className={styles.summaryLbl}>Insights unlocked</span>
            </div>
            {summary.totalRefundedUSD > 0 && (
              <div className={styles.summaryStat}>
                <span className={styles.summaryVal}>${summary.totalRefundedUSD.toFixed(2)}</span>
                <span className={styles.summaryLbl}>Refunded</span>
              </div>
            )}
          </div>
        )}

        {/* ── Packs ────────────────────────────────────── */}
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Buy credits</h2>
          <Link to="/pricing" className={styles.sectionLink}>View pricing details →</Link>
        </div>

        {isLoadingPacks ? (
          <div className={styles.packsGrid}>
            <Skeleton height={220} /><Skeleton height={220} /><Skeleton height={220} />
          </div>
        ) : (
          <div className={styles.packsGrid}>
            {packs.map((pack) => {
              const isHighlight = pack.highlight;
              const perCredit   = pack.perCredit ?? (pack.credits > 0 ? pack.amount / pack.credits : 0);
              const busy        = isCheckingOut;
              return (
                <div
                  key={pack.id}
                  className={`${styles.packCard} ${isHighlight ? styles.packCardHighlight : ''}`}
                >
                  {isHighlight && <div className={styles.packBadge}>Most popular</div>}

                  <div className={styles.packHeader}>
                    <p className={styles.packLabel}>{pack.label || `${pack.credits} Credits`}</p>
                    {pack.description && <p className={styles.packDesc}>{pack.description}</p>}
                  </div>

                  <div className={styles.packCredits}>
                    <span className={styles.packIcon}>◈</span>
                    <span className={styles.packNum}>{pack.credits}</span>
                  </div>

                  <p className={styles.packPrice}>${pack.amount}</p>
                  {pack.credits > 1 && (
                    <p className={styles.packPer}>${perCredit.toFixed(2)} / credit</p>
                  )}

                  {/* Reserve the "Save X%" slot on every card so buttons
                      align at the same y-coordinate across the grid. */}
                  {pack.save > 0 ? (
                    <div className={styles.saveTag}>Save {pack.save}%</div>
                  ) : (
                    <div className={styles.saveTagPlaceholder} aria-hidden="true" />
                  )}

                  <button
                    className={`${styles.buyBtn} ${isHighlight ? styles.buyBtnHighlight : ''}`}
                    onClick={() => buyPack(pack.id)}
                    disabled={busy}
                    type="button"
                  >
                    {busy ? <span className={styles.spinner} /> : 'Buy now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Transactions ─────────────────────────────── */}
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Transaction history</h2>
          <button
            className={styles.portalBtn}
            onClick={openPortal}
            disabled={isOpeningPortal}
            type="button"
            title="Manage billing — payment methods, invoices, receipts"
          >
            {isOpeningPortal ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                Manage billing
              </>
            )}
          </button>
        </div>

        {isLoadingTx ? (
          <div className={styles.txSkeletons}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={64} />)}
          </div>
        ) : (
          <div className={styles.txTable}>
            {transactions.length === 0 && (
              <p className={styles.noTx}>No transactions yet.</p>
            )}
            {transactions.map((tx) => {
              const canRefund = isRefundEligible(tx);
              const refunding = refundingTxId === tx._id;
              const isNegative = tx.creditDelta < 0;

              return (
                <div key={tx._id} className={styles.txRow}>
                  <div className={styles.txLeft}>
                    <p className={styles.txType}>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</p>
                    <p className={styles.txDesc}>{displayDesc(tx)}</p>
                    <p className={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                      {tx.stripe?.amountPaid ? (
                        <>
                          <span className={styles.sep}>·</span>
                          ${(tx.stripe.amountPaid / 100).toFixed(2)}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className={styles.txRight}>
                    <span className={isNegative ? styles.negative : styles.positive}>
                      {tx.creditDelta > 0 ? '+' : ''}{tx.creditDelta}
                    </span>
                    <span className={styles.txBalance}>Balance: {tx.balanceAfter}</span>
                    {canRefund && (
                      <button
                        className={styles.refundBtn}
                        onClick={() => refundTransaction(tx._id)}
                        disabled={refunding}
                        type="button"
                        title={`Self-serve refunds are available within ${REFUND_SELF_SERVE_WINDOW_HOURS} hours of purchase`}
                      >
                        {refunding ? 'Refunding…' : 'Refund'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {pages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  type="button"
                >
                  ← Prev
                </button>
                <span className={styles.pageInfo}>{page} / {pages}</span>
                <button
                  className={styles.pageBtn}
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
