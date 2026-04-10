import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { selectCredits } from '@/store/slices/authSlice';
import { creditsAPI, getErrorMsg } from '@/services/api';
import { TRANSACTION_TYPE_LABELS } from '@/constants/app';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './WalletPage.module.scss';

export default function WalletPage() {
  const credits = useSelector(selectCredits);
  const [page, setPage] = useState(1);

  const { data: packs = [], isLoading: packsLoading } = useQuery(
    'creditPacks',
    () => creditsAPI.getCreditPacks().then(r => r.data.packs)
  );

  const { data: txData, isLoading: txLoading } = useQuery(
    ['transactions', page],
    () => creditsAPI.getTransactions({ page, limit: 10 }).then(r => r.data),
    { keepPreviousData: true }
  );

  const checkout = useMutation(
    (packId) => creditsAPI.createCheckout(packId),
    {
      onSuccess: (res) => { window.location.href = res.data.url; },
      onError:   (e)   => toast.error(getErrorMsg(e)),
    }
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Wallet</h1>

        {/* Balance card */}
        <div className={styles.balanceCard}>
          <div>
            <p className={styles.balLabel}>Current Balance</p>
            <div className={styles.balValue}>
              <span className={styles.balIcon}>◈</span>
              <span className={styles.balNum}>{credits}</span>
            </div>
            <p className={styles.balSub}>credits available</p>
          </div>
          <div className={styles.balInfo}>
            <div className={styles.balFact}><span>◈</span> 1 credit = 1 AI insight</div>
            <div className={styles.balFact}><span>∞</span> Credits never expire</div>
            <div className={styles.balFact}><span>↩</span> Auto-refund on failures</div>
          </div>
        </div>

        {/* Credit packs */}
        <h2 className={styles.sectionTitle}>Purchase Credits</h2>
        {packsLoading ? (
          <div className={styles.packsGrid}>
            <Skeleton height={180} /><Skeleton height={180} />
          </div>
        ) : (
          <div className={styles.packsGrid}>
            {packs.map((pack) => (
              <div key={pack.id} className={styles.packCard}>
                <div className={styles.packTop}>
                  <div className={styles.packCredits}>
                    <span className={styles.packIcon}>◈</span>
                    <span className={styles.packNum}>{pack.credits}</span>
                  </div>
                  <p className={styles.packLabel}>{pack.credits === 1 ? '1 Credit' : `${pack.credits} Credits`}</p>
                  <p className={styles.packPrice}>${pack.amount}</p>
                  {pack.credits > 1 && (
                    <p className={styles.packPerCredit}>${(pack.amount / pack.credits).toFixed(2)} / credit</p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  loading={checkout.isLoading && checkout.variables === pack.id}
                  onClick={() => checkout.mutate(pack.id)}
                >
                  Buy Now
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Transaction history */}
        <h2 className={styles.sectionTitle}>Transaction History</h2>

        {txLoading ? (
          <div className={styles.txSkeletons}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={56} />)}
          </div>
        ) : (
          <div className={styles.txTable}>
            {(txData?.transactions || []).length === 0 && (
              <p className={styles.noTx}>No transactions yet. Purchase credits or unlock an insight to get started.</p>
            )}

            {(txData?.transactions || []).map((tx) => (
              <div key={tx._id} className={styles.txRow}>
                <div className={styles.txLeft}>
                  <p className={styles.txType}>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</p>
                  {tx.description && <p className={styles.txDesc}>{tx.description}</p>}
                  <p className={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className={styles.txRight}>
                  <span className={tx.creditDelta > 0 ? styles.positive : styles.negative}>
                    {tx.creditDelta > 0 ? '+' : ''}{tx.creditDelta}
                  </span>
                  <span className={styles.txBalance}>Balance: {tx.balanceAfter}</span>
                </div>
              </div>
            ))}

            {txData?.pages > 1 && (
              <div className={styles.pagination}>
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <span className={styles.pageInfo}>{page} / {txData.pages}</span>
                <Button variant="ghost" size="sm" disabled={page === txData.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}