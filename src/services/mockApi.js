// Mock backend. Persists to localStorage so the demo survives refreshes.
// Method names and return shapes mirror services/api.js - keep the two in step.
import { config } from '../config';
import { todayISO } from '../utils/format';
import { extractTransactions } from '../utils/mockExtraction';
import { buildDashboard, buildTaxPosition } from '../utils/finance';
import { buildFinancialReportPdf, buildTaxReportPdf } from '../utils/reportPdf';

const STORAGE_KEY = 'zedbiz-lens:business-ledger:v2';
const PROFILE_KEY = 'zedbiz-lens:business-profile:v1';
const wait = (ms = config.mockLatencyMs) => new Promise((resolve) => setTimeout(resolve, ms));
let cache = null;
let storageScope = 'guest';
const scopedKey = (key) => `${key}:${storageScope}`;

export function setMockStorageScope(userId = 'guest') {
  const nextScope = String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  if (storageScope === nextScope) return;
  storageScope = nextScope;
  cache = null;
}

function seed() { return { transactions: [] }; }

function persist(state) {
  try {
    localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(state));
  } catch {
    /* storage full or unavailable - the demo keeps working in memory */
  }
}

function load() {
  if (cache) return cache;
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(scopedKey(STORAGE_KEY)) || 'null');
  } catch {
    state = null;
  }
  if (!state || !Array.isArray(state.transactions)) {
    state = seed();
    persist(state);
  } else if (state.transactions.some((tx) => tx.synthetic || tx.businessId !== 'my-business')) {
    // Hide the old shared demo ledgers while preserving records the owner entered.
    state.transactions = state.transactions.filter((tx) => !tx.synthetic && tx.businessId === 'my-business');
    persist(state);
  }
  cache = state;
  return cache;
}

const findIndex = (state, id) => state.transactions.findIndex((tx) => tx.id === id);
const forBusiness = (state, businessId) => state.transactions.filter((tx) => tx.businessId === businessId);
const confirmedFor = (state, businessId) => forBusiness(state, businessId).filter((tx) => tx.status === 'confirmed');
function customBusiness() {
  try {
    const profile = JSON.parse(localStorage.getItem(scopedKey(PROFILE_KEY)) || 'null');
    if (profile?.id === 'my-business' && profile.businessName) {
      return { id: profile.id, name: profile.businessName, kind: profile.businessType, location: profile.district || profile.province || profile.location || 'Zambia', profile: true };
    }
  } catch { /* the demo still works if storage is unavailable */ }
  return null;
}

const businessById = () => customBusiness() || { id: 'my-business', name: 'My business', kind: 'Business', location: 'Zambia' };

function validatePatch(patch = {}) {
  if (patch.amount !== undefined && !(Number(patch.amount) > 0)) throw new Error('Amount must be greater than zero.');
  if (patch.description !== undefined && !String(patch.description).trim()) throw new Error('Add a short description.');
  if (patch.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(patch.date)) throw new Error('Choose a valid date.');
}

function applyChange(id, change) {
  const state = load();
  const index = findIndex(state, id);
  if (index === -1) throw new Error('This entry no longer exists. Refresh and try again.');
  validatePatch(change);
  const next = { ...state.transactions[index], ...change };
  if (change.amount !== undefined) next.amount = Number(change.amount);
  state.transactions[index] = next;
  persist(state);
  return next;
}

export const mockApi = {
  async listBusinesses() {
    await wait(120);
    return [businessById()];
  },

  async getTransactions({ businessId }) {
    await wait();
    return forBusiness(load(), businessId);
  },

  async submitEntry({ businessId, text }) {
    await wait(700); // pretend something is being processed
    const trimmed = String(text || '').trim();
    if (trimmed.length < 3) throw new Error('Type a few words about what happened in your business.');
    const { transactions: extracted } = extractTransactions(trimmed);
    if (!extracted.length) {
      throw new Error('No amounts found. Include a Kwacha amount, for example "paid K100 for transport".');
    }
    const state = load();
    const entryId = `entry-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const created = extracted.map((item, i) => ({
      ...item,
      id: `${entryId}-${i + 1}`,
      businessId,
      status: 'pending',
      entryId,
      source: trimmed,
      synthetic: false,
      createdAt,
    }));
    state.transactions.push(...created);
    persist(state);
    return { entryId, text: trimmed, transactions: created };
  },

  async submitAgentDraft({ businessId, text, draft }) {
    await wait(180);
    const source = String(text || '').trim();
    const amount = Number(draft?.amount);
    if (source.length < 3 || source.length > 500) throw new Error('The source note must be between 3 and 500 characters.');
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) throw new Error('Enter an amount greater than zero.');
    if (!['income', 'expense'].includes(draft?.type)) throw new Error('The agent can only draft an income or expense entry.');
    if (businessId !== 'my-business') throw new Error('Choose your business workspace first.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft?.date || '')) throw new Error('Choose a valid date.');
    const state = load();
    const entryId = `agent-${Date.now()}`;
    const transaction = {
      id: `${entryId}-1`,
      entryId,
      businessId,
      type: draft.type,
      category: String(draft.category || '').slice(0, 60) || (draft.type === 'income' ? 'Sales' : 'Other expenses'),
      description: String(draft.description || source).slice(0, 80),
      amount,
      date: draft.date,
      confidence: Number.isFinite(Number(draft.confidence)) ? Math.min(1, Math.max(0, Number(draft.confidence))) : null,
      status: 'pending',
      source,
      synthetic: false,
      ...(draft.type === 'income' ? { taxable: 'unsure', taxReason: 'Review tax treatment before using this record.' } : {}),
      createdAt: new Date().toISOString(),
    };
    state.transactions.push(transaction);
    persist(state);
    return { entryId, text: source, transactions: [transaction] };
  },

  async updateTransaction(id, patch) {
    await wait(200);
    return applyChange(id, patch);
  },

  async confirmTransaction(id, patch = {}) {
    await wait(200);
    return applyChange(id, { ...patch, status: 'confirmed', confirmedAt: new Date().toISOString() });
  },

  async rejectTransaction(id) {
    await wait(200);
    return applyChange(id, { status: 'rejected' });
  },

  async getDashboard({ businessId, period }) {
    await wait();
    return buildDashboard(confirmedFor(load(), businessId), period);
  },

  async getTaxPosition({ businessId }) {
    await wait();
    return buildTaxPosition(confirmedFor(load(), businessId));
  },

  async downloadFinancialReport({ businessId, period }) {
    await wait(600);
    const business = businessById(businessId);
    const dashboard = buildDashboard(confirmedFor(load(), businessId), period);
    return { blob: buildFinancialReportPdf(business, dashboard), filename: `zedbiz-financial-report-${business.id}-${period}.pdf` };
  },

  async downloadTaxReport({ businessId }) {
    await wait(600);
    const business = businessById(businessId);
    const tax = buildTaxPosition(confirmedFor(load(), businessId));
    return { blob: buildTaxReportPdf(business, tax), filename: `zedbiz-tax-position-${business.id}.pdf` };
  },

  async resetDemoData() {
    await wait(300);
    cache = seed();
    persist(cache);
  },
};

