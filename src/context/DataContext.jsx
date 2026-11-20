import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { transactionService } from '../services/transactionService';
import { clearAgentEvents, setAgentLogScope } from '../services/agentLog';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);
const BUSINESS_KEY = 'zedbiz-lens:active-business';
const PROFILE_KEY = 'zedbiz-lens:business-profile:v1';
const scopedKey = (key, userId) => `${key}:${String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

function readStoredBusiness(userId) {
  try {
    return localStorage.getItem(scopedKey(BUSINESS_KEY, userId));
  } catch {
    return null;
  }
}

function readStoredProfile(userId) {
  try {
    const profile = JSON.parse(localStorage.getItem(scopedKey(PROFILE_KEY, userId)) || 'null');
    return profile && typeof profile === 'object' ? profile : null;
  } catch {
    return null;
  }
}

function readInitialBusiness(userId) {
  return readStoredBusiness(userId) || 'my-business';
}

/**
 * Holds the active business and its transactions. `version` increases whenever a
 * confirmed figure could have changed, so dashboards and tax views refetch.
 */
export function DataProvider({ children }) {
  const { user, businessProfile: cloudProfile } = useAuth();
  const userId = user?.id || 'guest';
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessIdState] = useState(() => readInitialBusiness(userId));
  const [businessProfile, setBusinessProfileState] = useState(() => readStoredProfile(userId));
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    transactionService.setUserScope(userId);
    setAgentLogScope(userId);
    const profile = cloudProfile || readStoredProfile(userId);
    if (cloudProfile) {
      try { localStorage.setItem(scopedKey(PROFILE_KEY, userId), JSON.stringify(cloudProfile)); } catch { /* profile remains in memory */ }
    }
    setBusinessProfileState(profile);
    setBusinessIdState(readStoredBusiness(userId) || 'my-business');
  }, [userId, cloudProfile]);

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
      localStorage.setItem(scopedKey(BUSINESS_KEY, userId), id);
    } catch {
      /* ignore */
    }
    setBusinessIdState(id);
  }, [userId]);

  const saveBusinessProfile = useCallback((profile) => {
    const clean = {
      id: 'my-business',
      displayName: String(profile.displayName || '').trim().slice(0, 50),
      role: String(profile.role || 'Owner').slice(0, 24),
      businessName: String(profile.businessName || '').trim().slice(0, 80),
      businessType: String(profile.businessType || 'other').slice(0, 40),
      businessFormality: ['informal', 'formalizing', 'registered'].includes(profile.businessFormality) ? profile.businessFormality : 'informal',
      province: String(profile.province || '').slice(0, 32),
      district: String(profile.district || '').trim().slice(0, 80),
      location: String(profile.district || profile.province || profile.location || '').trim().slice(0, 80),
      language: String(profile.language || 'English').slice(0, 24),
      recordChannels: Array.isArray(profile.recordChannels) ? profile.recordChannels.filter((channel) => ['cash', 'mobile_money', 'credit'].includes(channel)) : ['cash'],
      pacraStatus: profile.pacraStatus || 'unsure',
      zraStatus: profile.zraStatus || 'unsure',
      vatStatus: profile.vatStatus || 'unsure',
      formalizationInterest: profile.formalizationInterest || 'unsure',
      goals: Array.isArray(profile.goals) ? profile.goals.filter((goal) => ['records', 'profit', 'cashflow', 'tax_ready', 'growth'].includes(goal)) : ['records', 'profit'],
      biggestChallenge: ['keeping_records', 'pricing', 'stock', 'cashflow', 'customer_credit', 'tax', 'growth'].includes(profile.biggestChallenge) ? profile.biggestChallenge : 'keeping_records',
      operatingDaysPerWeek: String(Math.min(7, Math.max(1, Number(profile.operatingDaysPerWeek) || 6))),
      updatedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(scopedKey(PROFILE_KEY, userId), JSON.stringify(clean)); } catch { /* profile remains available in memory */ }
    setBusinessProfileState(clean);
    setBusinessId('my-business');
    return clean;
  }, [setBusinessId, userId]);

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

  const submitAgentDraft = useCallback(
    async ({ text, draft }) => {
      const result = await transactionService.submitAgentDraft({ businessId, text, draft });
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
    clearAgentEvents();
    await load();
    bump();
  }, [load, bump]);

  const value = useMemo(() => {
    const pendingCount = transactions.filter((t) => t.status === 'pending').length;
    return {
      businesses,
      business: businesses.find((b) => b.id === businessId) || null,
      businessProfile,
      businessId,
      setBusinessId,
      saveBusinessProfile,
      transactions,
      pendingCount,
      status,
      error,
      version,
      reload: load,
      submitEntry,
      submitAgentDraft,
      updateTransaction,
      confirmTransaction,
      rejectTransaction,
      confirmMany,
      rejectMany,
      resetDemoData,
    };
  }, [businesses, businessId, setBusinessId, businessProfile, saveBusinessProfile, transactions, status, error, version, load, submitEntry, submitAgentDraft, updateTransaction, confirmTransaction, rejectTransaction, confirmMany, rejectMany, resetDemoData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}

