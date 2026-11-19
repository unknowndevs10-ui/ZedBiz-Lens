// Mock backend. Persists to localStorage so the demo survives refreshes.
// Method names and return shapes mirror services/api.js - keep the two in step.
import { config } from '../config';
import { BUSINESSES, generateSeedTransactions } from '../data/mockData';
import { addDays, diffDays, todayISO } from '../utils/format';
import { extractTransactions } from '../utils/mockExtraction';
import { buildDashboard, buildTaxPosition } from '../utils/finance';
import { buildFinancialReportPdf, buildTaxReportPdf } from '../utils/reportPdf';

const STORAGE_KEY = 'zedbiz-lens:demo-data:v1';
const wait = (ms = config.mockLatencyMs) => new Promise((resolve) => setTimeout(resolve, ms));
let cache = null;

function seed() {
  const transactions = [];
  BUSINESSES.forEach((business) => transactions.push(...generateSeedTransactions(business)));
  return { seededOn: todayISO(), transactions };
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable - the demo keeps working in memory */
  }
}

function load() {
  if (cache) return cache;
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    state = null;
  }
  if (!state || !Array.isArray(state.transactions)) {
    state = seed();
    persist(state);
  } else if (state.seededOn !== todayISO()) {
    // Slide the synthetic history forward so the demo always ends today.
    const shift = diffDays(todayISO(), state.seededOn);
    state.transactions = state.transactions.map((tx) => (tx.synthetic ? { ...tx, date: addDays(tx.date, shift) } : tx));
    state.seededOn = todayISO();
    persist(state);
  }
  cache = state;
  return cache;
}

const findIndex = (state, id) => state.transactions.findIndex((tx) => tx.id === id);
const forBusiness = (state, businessId) => state.transactions.filter((tx) => tx.businessId === businessId);
const confirmedFor = (state, businessId) => forBusiness(state, businessId).filter((tx) => tx.status === 'confirmed');
const businessById = (id) => BUSINESSES.find((b) => b.id === id) || BUSINESSES[0];

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
    return BUSINESSES;
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
