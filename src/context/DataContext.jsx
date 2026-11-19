import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { transactionService } from '../services/transactionService';

const DataContext = createContext(null);
const BUSINESS_KEY = 'zedbiz-lens:active-business';

function readStoredBusiness() {
  try {
    return localStorage.getItem(BUSINESS_KEY);
  } catch {
    return null;
  }
}

/**
 * Holds the active business and its transactions. `version` increases whenever a
 * confirmed figure could have changed, so dashboards and tax views refetch.
 */
export function DataProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessIdState] = useState(() => readStoredBusiness() || 'retail');
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setStatus('loading');
    setError(null);
    try {
      const [list, businessList] = await Promise.all([transactionService.list(businessId), transactionService.listBusinesses()]);
      if (request !== requestRef.current) return;
      setBusinesses(businessList);
      if (businessList.length && !businessList.some((b) => b.id === businessId)) {
        setBusinessIdState(businessList[0].id);
        return; // effect re-runs with the valid id
      }
      setTransactions(list);
      setStatus('ready');
    } catch (err) {
      if (request !== requestRef.current) return;
      setError(err);
      setStatus('error');
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const setBusinessId = useCallback((id) => {
    try {
      localStorage.setItem(BUSINESS_KEY, id);
    } catch {
      /* ignore */
    }
    setBusinessIdState(id);
  }, []);

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const replaceOne = useCallback((tx) => setTransactions((list) => list.map((t) => (t.id === tx.id ? tx : t))), []);

  const submitEntry = useCallback(
    async (text) => {
      const result = await transactionService.submitEntry({ businessId, text });
      setTransactions((list) => [...result.transactions, ...list]);
      return result;
    },
    [businessId],
  );

  const updateTransaction = useCallback(
    async (id, patch) => {
      const tx = await transactionService.update(id, patch);
      replaceOne(tx);
      if (tx.status === 'confirmed') bump();
      return tx;
    },
    [replaceOne, bump],
  );

  const confirmTransaction = useCallback(
    async (id, patch) => {
      const tx = await transactionService.confirm(id, patch);
      replaceOne(tx);
      bump();
      return tx;
    },
    [replaceOne, bump],
  );

  const rejectTransaction = useCallback(
    async (id) => {
      const tx = await transactionService.reject(id);
      replaceOne(tx);
      return tx;
    },
    [replaceOne],
  );

  const resolveMany = useCallback(
    async (ids, action) => {
      const results = await Promise.all(ids.map((id) => action(id)));
      setTransactions((list) => list.map((t) => results.find((r) => r.id === t.id) || t));
      return results;
    },
    [],
  );
  const confirmMany = useCallback(
    async (ids) => {
      const results = await resolveMany(ids, (id) => transactionService.confirm(id));
      bump();
      return results;
    },
    [resolveMany, bump],
  );
  const rejectMany = useCallback((ids) => resolveMany(ids, (id) => transactionService.reject(id)), [resolveMany]);

  const resetDemoData = useCallback(async () => {
    await transactionService.resetDemo();
    await load();
    bump();
  }, [load, bump]);

  const value = useMemo(() => {
    const pendingCount = transactions.filter((t) => t.status === 'pending').length;
    return {
      businesses,
      business: businesses.find((b) => b.id === businessId) || null,
      businessId,
      setBusinessId,
      transactions,
      pendingCount,
      status,
      error,
      version,
      reload: load,
      submitEntry,
      updateTransaction,
      confirmTransaction,
      rejectTransaction,
      confirmMany,
      rejectMany,
      resetDemoData,
    };
  }, [businesses, businessId, setBusinessId, transactions, status, error, version, load, submitEntry, updateTransaction, confirmTransaction, rejectTransaction, confirmMany, rejectMany, resetDemoData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
