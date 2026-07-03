// src/hooks/useWallet.js
//
// One hook that owns everything the wallet + billing UI needs:
// packs list, transaction history, spend summary, buy pack (Stripe
// redirect), open billing portal (Stripe redirect), request refund.

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectCredits, selectToken, getLoggedInUser } from '@/store/slices/authSlice';
import { createApiThunk } from '@/utils/apiHelper';
import {
  createCheckoutSession,
  createPortalSession,
  requestRefund,
  fetchSpendSummary,
  getErrorMsg,
} from '@/services/api';

// ── Redux thunks for read-only endpoints ──────────────────────
export const fetchCreditPacks = createApiThunk({
  typePrefix: 'wallet/fetchPacks',
  method: 'GET',
  url: '/credits/packs',
});

export const fetchTransactions = createApiThunk({
  typePrefix: 'wallet/fetchTransactions',
  method: 'GET',
  url: '/credits/transactions',
});

/**
 * useWallet — single entry point for wallet UI.
 *
 * const {
 *   credits,
 *   packs, isLoadingPacks,
 *   transactions, isLoadingTx, pages, page, setPage,
 *   summary, isLoadingSummary,
 *   buyPack, isCheckingOut,
 *   openPortal, isOpeningPortal,
 *   refundTransaction, refundingTxId,
 *   refreshBalance,
 * } = useWallet();
 */
export function useWallet() {
  const dispatch = useDispatch();
  const credits  = useSelector(selectCredits);
  const token    = useSelector(selectToken);

  const [packs,            setPacks]            = useState([]);
  const [isLoadingPacks,   setIsLoadingPacks]   = useState(false);

  const [transactions,     setTransactions]     = useState([]);
  const [pages,            setPages]            = useState(1);
  const [page,             setPage]             = useState(1);
  const [isLoadingTx,      setIsLoadingTx]      = useState(false);

  const [summary,          setSummary]          = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [isCheckingOut,    setIsCheckingOut]    = useState(false);
  const [isOpeningPortal,  setIsOpeningPortal]  = useState(false);
  const [refundingTxId,    setRefundingTxId]    = useState(null);

  // ─── Load packs on mount ────────────────────────────────────
  useEffect(() => {
    setIsLoadingPacks(true);
    dispatch(fetchCreditPacks())
      .then((r) => { if (r.payload?.packs) setPacks(r.payload.packs); })
      .finally(() => setIsLoadingPacks(false));
  }, []); // eslint-disable-line

  // ─── Load spend summary on mount (if authenticated) ─────────
  useEffect(() => {
    if (!token) return;
    setIsLoadingSummary(true);
    fetchSpendSummary(token)
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setIsLoadingSummary(false));
  }, [token]);

  // ─── Load transactions on page change ───────────────────────
  const loadTransactions = useCallback(() => {
    setIsLoadingTx(true);
    dispatch(fetchTransactions({ params: { page, limit: 10 } }))
      .then((r) => {
        if (r.payload?.transactions) setTransactions(r.payload.transactions);
        if (r.payload?.pages)        setPages(r.payload.pages);
      })
      .finally(() => setIsLoadingTx(false));
  }, [dispatch, page]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // ─── Refresh balance from server (used after webhook redirect) ─
  const refreshBalance = useCallback(async () => {
    try {
      await dispatch(getLoggedInUser());
    } catch { /* no-op; toast handled elsewhere */ }
  }, [dispatch]);

  // ─── Stripe Checkout — redirect to hosted page ──────────────
  const buyPack = async (packId) => {
    if (!token) {
      toast.error('Please log in to purchase credits.');
      return;
    }
    setIsCheckingOut(true);
    try {
      const data = await createCheckoutSession(packId, token);
      if (data?.url) {
        // Redirect. No cleanup needed — page is about to unload.
        window.location.href = data.url;
      } else {
        toast.error('Could not start checkout. Please try again.');
        setIsCheckingOut(false);
      }
    } catch (err) {
      toast.error(getErrorMsg(err));
      setIsCheckingOut(false);
    }
  };

  // ─── Stripe Billing Portal — redirect ───────────────────────
  const openPortal = async () => {
    if (!token) {
      toast.error('Please log in to manage billing.');
      return;
    }
    setIsOpeningPortal(true);
    try {
      const data = await createPortalSession(token);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not open billing portal.');
        setIsOpeningPortal(false);
      }
    } catch (err) {
      toast.error(getErrorMsg(err));
      setIsOpeningPortal(false);
    }
  };

  // ─── Self-serve refund ──────────────────────────────────────
  const refundTransaction = async (transactionId) => {
    if (!token) return;
    setRefundingTxId(transactionId);
    try {
      const data = await requestRefund(transactionId, token);
      toast.success(data.message || 'Refund initiated.', { duration: 5000 });
      // Reload transactions + balance after a short delay for the
      // Stripe webhook to fire and update credit balance.
      setTimeout(() => {
        loadTransactions();
        refreshBalance();
      }, 2500);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setRefundingTxId(null);
    }
  };

  return {
    credits,

    packs, isLoadingPacks,

    transactions, isLoadingTx, pages, page, setPage,

    summary, isLoadingSummary,

    buyPack,           isCheckingOut,
    openPortal,        isOpeningPortal,
    refundTransaction, refundingTxId,

    refreshBalance,
  };
}
