// src/hooks/useWallet.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectCredits, selectToken, setCredits } from '@/store/slices/authSlice';
import { createApiThunk } from '@/utils/apiHelper';
import { createCheckoutSession, getErrorMsg } from '@/services/api';

// ── Wallet-specific thunks ────────────────────────────────────
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
 * useWallet()
 * Use on WalletPage.
 *
 * const { credits, packs, transactions, pages, page, setPage, buyPack, isCheckingOut } = useWallet();
 */
export function useWallet() {
  const dispatch = useDispatch();
  const credits  = useSelector(selectCredits);
  const token    = useSelector(selectToken);

  const [packs,         setPacks]         = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [pages,         setPages]         = useState(1);
  const [page,          setPage]          = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [isLoadingTx,   setIsLoadingTx]   = useState(false);

  // Load packs on mount
  useEffect(() => {
    setIsLoadingPacks(true);
    dispatch(fetchCreditPacks())
      .then(r => { if (r.payload?.packs) setPacks(r.payload.packs); })
      .finally(() => setIsLoadingPacks(false));
  }, []);

  // Load transactions when page changes
  useEffect(() => {
    setIsLoadingTx(true);
    dispatch(fetchTransactions({ params: { page, limit: 10 } }))
      .then(r => {
        if (r.payload?.transactions) setTransactions(r.payload.transactions);
        if (r.payload?.pages)        setPages(r.payload.pages);
      })
      .finally(() => setIsLoadingTx(false));
  }, [page]);

  // Stripe checkout — browser redirect, not a thunk
  const buyPack = async (packId) => {
    setIsCheckingOut(true);
    try {
      const data = await createCheckoutSession(packId, token);
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setIsCheckingOut(false);
    }
  };

  return {
    credits,
    packs,       isLoadingPacks,
    transactions, isLoadingTx,
    pages, page, setPage,
    buyPack, isCheckingOut,
  };
}