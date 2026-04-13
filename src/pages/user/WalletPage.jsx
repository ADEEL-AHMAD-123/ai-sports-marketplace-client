// src/pages/user/WalletPage.jsx
import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { TRANSACTION_TYPE_LABELS } from '@/constants/app';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './WalletPage.module.scss';

export default function WalletPage() {
  const {
    credits,
    packs, isLoadingPacks,
    transactions, isLoadingTx,
    pages, page, setPage,
    buyPack, isCheckingOut,
  } = useWallet();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Wallet</h1>

        {/* Balance */}
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
            <div className={styles.balFact}><span>◈</span>1 credit = 1 AI scouting report</div>
            <div className={styles.balFact}><span>∞</span>Credits never expire</div>
            <div className={styles.balFact}><span>↩</span>Auto-refund if AI fails</div>
          </div>
        </div>

        {/* Packs */}
        <h2 className={styles.sectionTitle}>Purchase Credits</h2>
        {isLoadingPacks ? (
          <div className={styles.packsGrid}>
            <Skeleton height={180} /><Skeleton height={180} /><Skeleton height={180} />
          </div>
        ) : (
          <div className={styles.packsGrid}>
            {packs.map(pack => (
              <div key={pack.id} className={styles.packCard}>
                <div className={styles.packCredits}>
                  <span className={styles.packIcon}>◈</span>
                  <span className={styles.packNum}>{pack.credits}</span>
                </div>
                <p className={styles.packLabel}>{pack.label || `${pack.credits} Credits`}</p>
                <p className={styles.packPrice}>${pack.amount}</p>
                {pack.credits > 1 && (
                  <p className={styles.packPer}>${(pack.amount / pack.credits).toFixed(2)} / credit</p>
                )}
                <button
                  className={styles.buyBtn}
                  onClick={() => buyPack(pack.id)}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? <span className={styles.spinner} /> : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Transactions */}
        <h2 className={styles.sectionTitle}>Transaction History</h2>
        {isLoadingTx ? (
          <div className={styles.txSkeletons}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={56} />)}
          </div>
        ) : (
          <div className={styles.txTable}>
            {transactions.length === 0 && (
              <p className={styles.noTx}>No transactions yet.</p>
            )}
            {transactions.map(tx => (
              <div key={tx._id} className={styles.txRow}>
                <div className={styles.txLeft}>
                  <p className={styles.txType}>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</p>
                  {tx.description && <p className={styles.txDesc}>{tx.description}</p>}
                  <p className={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className={styles.txRight}>
                  <span className={tx.creditDelta > 0 ? styles.positive : styles.negative}>
                    {tx.creditDelta > 0 ? '+' : ''}{tx.creditDelta}
                  </span>
                  <span className={styles.txBalance}>Balance: {tx.balanceAfter}</span>
                </div>
              </div>
            ))}
            {pages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className={styles.pageInfo}>{page} / {pages}</span>
                <button className={styles.pageBtn} disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}