// ---------------------------------------------------------------------------
// API entry point.
//   import api from './api'  ->  mock or live, chosen once by config.useMockData.
//
// The live client below is a PLACEHOLDER. Endpoint paths, payloads and response
// shapes are NOT final: the head developer will supply the official FastAPI
// contract. When it arrives, change ENDPOINTS and the request bodies here, and
// the normalisers in transactionService.js / insightsService.js. Components
// should not need to change.
// ---------------------------------------------------------------------------
import { config } from '../config';
import { mockApi } from './mockApi';

export const ENDPOINTS = {
  businesses: '/businesses',
  entries: '/entries',
  transactions: '/transactions',
  transaction: (id) => `/transactions/${encodeURIComponent(id)}`,
  confirmTransaction: (id) => `/transactions/${encodeURIComponent(id)}/confirm`,
  rejectTransaction: (id) => `/transactions/${encodeURIComponent(id)}/reject`,
  dashboard: '/dashboard',
  taxPosition: '/tax/position',
  financialReport: '/reports/financial',
  taxReport: '/reports/tax',
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, query, expect = 'json' } = {}) {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(`Could not reach the server at ${config.apiBaseUrl}. Check that the backend is running.`, 0);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = typeof data.detail === 'string' ? data.detail : data.message || '';
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail || `Request failed (${response.status}).`, response.status);
  }
  if (expect === 'blob') {
    const header = response.headers.get('Content-Disposition') || '';
    const match = header.match(/filename="?([^";]+)"?/i);
    return { blob: await response.blob(), filename: match ? match[1] : null };
  }
  return response.json();
}

const liveApi = {
  listBusinesses: () => request(ENDPOINTS.businesses),
  getTransactions: ({ businessId }) => request(ENDPOINTS.transactions, { query: { business_id: businessId } }),
  submitEntry: ({ businessId, text }) => request(ENDPOINTS.entries, { method: 'POST', body: { business_id: businessId, text } }),
  updateTransaction: (id, patch) => request(ENDPOINTS.transaction(id), { method: 'PATCH', body: patch }),
  confirmTransaction: (id, patch) => request(ENDPOINTS.confirmTransaction(id), { method: 'POST', body: patch }),
  rejectTransaction: (id) => request(ENDPOINTS.rejectTransaction(id), { method: 'POST' }),
  getDashboard: ({ businessId, period }) => request(ENDPOINTS.dashboard, { query: { business_id: businessId, period } }),
  getTaxPosition: ({ businessId }) => request(ENDPOINTS.taxPosition, { query: { business_id: businessId } }),
  downloadFinancialReport: ({ businessId, period }) =>
    request(ENDPOINTS.financialReport, { query: { business_id: businessId, period }, expect: 'blob' }).then((r) => ({
      ...r,
      filename: r.filename || `zedbiz-financial-report-${period}.pdf`,
    })),
  downloadTaxReport: ({ businessId }) =>
    request(ENDPOINTS.taxReport, { query: { business_id: businessId }, expect: 'blob' }).then((r) => ({
      ...r,
      filename: r.filename || 'zedbiz-tax-position.pdf',
    })),
  resetDemoData: () => Promise.reject(new ApiError('Resetting demo data is only available in mock mode.', 400)),
};

const api = config.useMockData ? mockApi : liveApi;
export default api;
