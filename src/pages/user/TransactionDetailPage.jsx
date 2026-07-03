// src/pages/user/TransactionDetailPage.jsx
//
// Read-only page for a single wallet transaction — reached from the
// wallet history list. Shows everything: line items, invoice number,
// payment method (card brand + last 4), Stripe-hosted invoice link,
// refund action within the window, and clear "back to wallet" nav.
//
// Handles all transaction types: purchase, refund, insight_unlock,
// signup_bonus, chargeback, admin_grant/deduct — each with the right
// level of detail.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { selectToken, getLoggedInUser } from '@/store/slices/authSlice';
import { fetchTransaction, requestRefund, getErrorMsg } from '@/services/api';
import { TRANSACTION_TYPE_LABELS } from '@/constants/app';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './TransactionDetailPage.module.scss';

const $ = (usdCents) => `$${((usdCents || 0) / 100).toFixed(2)}`;
const formatDate = (iso) => new Date(iso).toLocaleString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
  hour: 'numeric', minute: '2-digit',
});
const formatShortDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});
const brandTitle = (b) => b ? (b.charAt(0).toUpperCase() + b.slice(1)) : null;

export default function TransactionDetailPage() {
  const { txId }   = useParams();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const token      = useSelector(selectToken);

  const [tx,      setTx]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [refunding, setRefunding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransaction(txId, token);
      setTx(data.transaction);
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Transaction · EdgeAI';
    if (token && txId) load();
    // eslint-disable-next-line
  }, [txId, token]);

  const handleRefund = async () => {
    if (!tx?.isRefundable || refunding) return;
    if (!confirm(
      `Refund ${$(tx.stripe?.amountPaid)} to your card?\n\n` +
      `${tx.stripe?.creditsPurchased} credits will be deducted from your balance.\n` +
      `Funds arrive back in 5–10 business days.`
    )) return;

    setRefunding(true);
    try {
      const res = await requestRefund(tx._id, token);
      toast.success(res.message || 'Refund initiated.');
      // Refresh balance + this transaction after webhook fires.
      setTimeout(() => {
        dispatch(getLoggedInUser());
        load();
      }, 2500);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.crumb}>
            <Link to="/wallet">← Wallet</Link>
          </div>
          <Skeleton height={40} />
          <Skeleton height={200} />
          <Skeleton height={140} />
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.crumb}>
            <Link to="/wallet">← Wallet</Link>
          </div>
          <div className={styles.notFound}>
            <h1>Transaction not found</h1>
            <p>{error || "This transaction doesn't exist or belongs to another account."}</p>
            <button className={styles.primaryBtn} onClick={() => navigate('/wallet')} type="button">
              Return to wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPurchase = tx.type === 'purchase';
  const isRefund   = tx.type === 'refund';
  const isUnlock   = tx.type === 'insight_unlock';
  const isBonus    = tx.type === 'signup_bonus';
  const isDelta    = tx.creditDelta > 0;

  const typeLabel  = TRANSACTION_TYPE_LABELS[tx.type] || tx.type;

  const cardLabel = tx.stripe?.cardBrand && tx.stripe?.cardLast4
    ? `${brandTitle(tx.stripe.cardBrand)} ending in ${tx.stripe.cardLast4}`
    : null;

  const amount        = tx.stripe?.amountPaid || 0;
  const amountRefunded = tx.stripe?.amountRefunded || 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >

          {/* Breadcrumb */}
          <div className={styles.crumb}>
            <Link to="/wallet">← Back to wallet</Link>
          </div>

          {/* Header — status badge + amount */}
          <div className={styles.header}>
            <div>
              <div className={styles.eyebrow}>{typeLabel}</div>
              <h1 className={styles.headerTitle}>
                {isPurchase && `${tx.stripe?.creditsPurchased ?? tx.creditDelta} credit${(tx.stripe?.creditsPurchased ?? tx.creditDelta) === 1 ? '' : 's'}`}
                {isRefund   && `Refund of ${$(amountRefunded)}`}
                {isUnlock   && (tx.insight?.playerName ? `${tx.insight.playerName} — ${tx.insight.statType?.replace('_', ' ')}` : 'Insight unlocked')}
                {isBonus    && `${tx.creditDelta} welcome credits`}
                {!isPurchase && !isRefund && !isUnlock && !isBonus && typeLabel}
              </h1>
              <div className={styles.headerSub}>
                {formatDate(tx.createdAt)}
              </div>
            </div>
            <div>
              <div className={`${styles.statusPill} ${isPurchase ? styles.statusPaid : isRefund ? styles.statusRefunded : isDelta ? styles.statusCredit : styles.statusDebit}`}>
                {isPurchase ? 'Paid' : isRefund ? 'Refunded' : isDelta ? 'Credit +' : 'Spent −'}
              </div>
              <div className={styles.headerAmount}>
                {isPurchase && $(amount)}
                {isRefund   && `−${$(amountRefunded)}`}
                {!isPurchase && !isRefund && `${isDelta ? '+' : ''}${tx.creditDelta}`}
              </div>
              {(!isPurchase && !isRefund) && (
                <div className={styles.headerAmountSub}>credits</div>
              )}
            </div>
          </div>

          {/* ── PURCHASE — invoice-style line items ─────────────── */}
          {isPurchase && (
            <>
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Invoice</span>
                  {tx.stripe?.invoiceNumber && (
                    <span className={styles.invNum}>{tx.stripe.invoiceNumber}</span>
                  )}
                </div>

                <table className={styles.lineItems}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Description</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className={styles.itemName}>{tx.description || 'Credit purchase'}</div>
                        <div className={styles.itemSub}>{tx.stripe?.creditsPurchased} credits × 1 unlock each</div>
                      </td>
                      <td>{tx.stripe?.creditsPurchased}</td>
                      <td>{tx.stripe?.creditsPurchased ? $(amount / tx.stripe.creditsPurchased) : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{$(amount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className={styles.totals}>
                  <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>{$(amount)}</span>
                  </div>
                  <div className={styles.totalRowFinal}>
                    <span>Total paid</span>
                    <span>{$(amount)} <small>USD</small></span>
                  </div>
                </div>
              </div>

              {/* Payment method + invoice links */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Payment details</span>
                </div>
                <div className={styles.kvGrid}>
                  {cardLabel && (
                    <>
                      <div className={styles.kvLabel}>Paid with</div>
                      <div className={styles.kvValue}>{cardLabel}</div>
                    </>
                  )}
                  <div className={styles.kvLabel}>Balance after</div>
                  <div className={styles.kvValue}>{tx.balanceAfter} credits</div>
                  {tx.stripe?.paymentIntentId && (
                    <>
                      <div className={styles.kvLabel}>Payment reference</div>
                      <div className={styles.kvValue}><code>{tx.stripe.paymentIntentId}</code></div>
                    </>
                  )}
                </div>

                {(tx.stripe?.invoiceHostedUrl || tx.stripe?.invoicePdfUrl) && (
                  <div className={styles.invoiceLinks}>
                    {tx.stripe.invoiceHostedUrl && (
                      <a href={tx.stripe.invoiceHostedUrl} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                        View full invoice
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                    {tx.stripe.invoicePdfUrl && (
                      <a href={tx.stripe.invoicePdfUrl} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                        Download PDF
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Refund action */}
              {tx.isRefundable && (
                <div className={styles.refundCard}>
                  <div>
                    <div className={styles.refundTitle}>Self-serve refund available</div>
                    <div className={styles.refundSub}>
                      You can refund this purchase within {tx.refundWindowHours} hours of the transaction.
                      Only available if you haven't unlocked any insights with these credits.
                    </div>
                  </div>
                  <button
                    className={styles.refundBtn}
                    onClick={handleRefund}
                    disabled={refunding}
                    type="button"
                  >
                    {refunding ? 'Processing…' : 'Refund purchase'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── REFUND — reference + link back to purchase ────── */}
          {isRefund && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Refund details</span>
              </div>
              <div className={styles.kvGrid}>
                <div className={styles.kvLabel}>Amount refunded</div>
                <div className={styles.kvValue}>{$(amountRefunded)} USD</div>
                <div className={styles.kvLabel}>Credits reversed</div>
                <div className={styles.kvValue}>{Math.abs(tx.creditDelta)}</div>
                <div className={styles.kvLabel}>Balance after</div>
                <div className={styles.kvValue}>{tx.balanceAfter} credits</div>
                {tx.refundReason && (
                  <>
                    <div className={styles.kvLabel}>Reason</div>
                    <div className={styles.kvValue}>{tx.refundReason.replace(/_/g, ' ')}</div>
                  </>
                )}
                {tx.stripe?.refundId && (
                  <>
                    <div className={styles.kvLabel}>Refund reference</div>
                    <div className={styles.kvValue}><code>{tx.stripe.refundId}</code></div>
                  </>
                )}
              </div>
              <p className={styles.helpNote}>
                Depending on your card issuer, funds typically arrive back on your original payment
                method within <strong>5–10 business days</strong>.
              </p>
            </div>
          )}

          {/* ── INSIGHT UNLOCK — link to insight ─────────────── */}
          {isUnlock && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Insight details</span>
              </div>
              <div className={styles.kvGrid}>
                {tx.insight?.sport && (
                  <>
                    <div className={styles.kvLabel}>Sport</div>
                    <div className={styles.kvValue}>{tx.insight.sport.toUpperCase()}</div>
                  </>
                )}
                {tx.insight?.playerName && (
                  <>
                    <div className={styles.kvLabel}>Player</div>
                    <div className={styles.kvValue}>{tx.insight.playerName}</div>
                  </>
                )}
                {tx.insight?.statType && (
                  <>
                    <div className={styles.kvLabel}>Prop</div>
                    <div className={styles.kvValue}>{tx.insight.statType.replace(/_/g, ' ')}</div>
                  </>
                )}
                <div className={styles.kvLabel}>Credits spent</div>
                <div className={styles.kvValue}>{Math.abs(tx.creditDelta)}</div>
                <div className={styles.kvLabel}>Balance after</div>
                <div className={styles.kvValue}>{tx.balanceAfter} credits</div>
              </div>
              {tx.insight?.insightId && (
                <Link to="/history" className={styles.linkArrow}>
                  View this insight in your history →
                </Link>
              )}
            </div>
          )}

          {/* ── BONUS / ADJUSTMENT — minimal display ─────────── */}
          {(isBonus || tx.type === 'admin_grant' || tx.type === 'admin_deduct') && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Details</span>
              </div>
              <div className={styles.kvGrid}>
                {tx.description && (
                  <>
                    <div className={styles.kvLabel}>Note</div>
                    <div className={styles.kvValue}>{tx.description}</div>
                  </>
                )}
                <div className={styles.kvLabel}>{isDelta ? 'Credits added' : 'Credits removed'}</div>
                <div className={styles.kvValue}>{isDelta ? '+' : ''}{tx.creditDelta}</div>
                <div className={styles.kvLabel}>Balance after</div>
                <div className={styles.kvValue}>{tx.balanceAfter} credits</div>
              </div>
            </div>
          )}

          {/* Support footer */}
          <div className={styles.supportFooter}>
            Have questions about this transaction? <a href="mailto:support@edgeai.bet">Contact support</a>
            {' '}or reference ID <code>{tx._id}</code>.
          </div>

        </motion.div>
      </div>
    </div>
  );
}
