// src/pages/user/WalletPage.jsx
//
// Authenticated user wallet:
//  - Current balance + spend summary
//  - Credit packs grid (with highlight badge, save %, description)
//  - Transaction history — each row is a link into its detail page
//    (/wallet/tx/:id) where the full invoice/refund/insight lives.
//
// We deliberately DO NOT surface a Stripe portal button here: our
// per-transaction detail page + invoice emails cover everything the
// portal would offer, so linking out was redundant.

import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { TRANSACTION_TYPE_LABELS } from '@/constants/app';
import { Skeleton } from '@/components/ui/Skeleton';
import UnverifiedBanner from '@/components/ui/UnverifiedBanner';
import styles from './WalletPage.module.scss';

// ── Transaction icon ─────────────────────────────────────────────
// A small type-specific glyph in the row helps users scan the history
// without reading every label — matches how Stripe / Revolut display
// their transaction feeds.
const TransactionIcon = ({ type }) => {
  const iconProps = {
    width: 16, height: 16, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (type) {
    case 'purchase':
      return <svg {...iconProps}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
    case 'refund':
      return <svg {...iconProps}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>;
    case 'insight_unlock':
      return <svg {...iconProps}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'signup_bonus':
      return <svg {...iconProps}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case 'chargeback':
      return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    default:
      return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
  }
};

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});
const formatShortMoney = (cents) => cents ? `$${(cents / 100).toFixed(2)}` : null;

// Human-readable summary line for each transaction type — richer than
// the raw `description` field, and consistent across types.
const summaryFor = (tx) => {
  switch (tx.type) {
    case 'purchase':
      return tx.stripe?.creditsPurchased
        ? `${tx.stripe.creditsPurchased} credits • ${formatShortMoney(tx.stripe.amountPaid) || ''}`
        : (tx.description || 'Credit purchase');
    case 'refund':
      return tx.stripe?.amountRefunded
        ? `${formatShortMoney(tx.stripe.amountRefunded)} refunded to card`
        : 'Refund issued';
    case 'insight_unlock':
      return tx.insight?.playerName
        ? `${tx.insight.playerName} — ${(tx.insight.statType || '').replace(/_/g, ' ')}`
        : 'Insight unlocked';
    case 'signup_bonus':
      return 'Welcome bonus';
    case 'chargeback':
      return 'Payment disputed';
    case 'admin_grant':
      return tx.description || 'Manual credit adjustment';
    case 'admin_deduct':
      return tx.description || 'Manual credit deduction';
    default:
      return tx.description || tx.type;
  }
};

export default function WalletPage() {
  const {
    credits,
    packs, isLoadingPacks,
    transactions, isLoadingTx,
    pages, page, setPage,
    summary, isLoadingSummary,
    buyPack, isCheckingOut,
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

        {/* ── Spend summary ─────────────────────────── */}
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
        </div>

        {isLoadingTx ? (
          <div className={styles.txList}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={68} />)}
          </div>
        ) : (
          <div className={styles.txList}>
            {transactions.length === 0 && (
              <p className={styles.noTx}>No transactions yet. Buy credits above to get started.</p>
            )}

            {transactions.map((tx) => {
              const isNegative = tx.creditDelta < 0;
              return (
                <Link
                  key={tx._id}
                  to={`/wallet/tx/${tx._id}`}
                  className={styles.txRow}
                  aria-label={`View details for ${TRANSACTION_TYPE_LABELS[tx.type] || tx.type}`}
                >
                  <div className={`${styles.txIcon} ${styles[`txIcon_${tx.type}`] || ''}`}>
                    <TransactionIcon type={tx.type} />
                  </div>

                  <div className={styles.txMain}>
                    <div className={styles.txTitle}>
                      {TRANSACTION_TYPE_LABELS[tx.type] || tx.type}
                    </div>
                    <div className={styles.txSummary}>{summaryFor(tx)}</div>
                    <div className={styles.txDate}>{formatDate(tx.createdAt)}</div>
                  </div>

                  <div className={styles.txRight}>
                    <div className={isNegative ? styles.negative : styles.positive}>
                      {tx.creditDelta > 0 ? '+' : ''}{tx.creditDelta}
                    </div>
                    <div className={styles.txBalance}>Balance {tx.balanceAfter}</div>
                  </div>

                  <div className={styles.txArrow} aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
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
