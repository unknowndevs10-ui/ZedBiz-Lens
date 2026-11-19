// Single place for runtime configuration. Components never read import.meta.env directly.
const toBool = (value, fallback) =>
  value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true';

export const config = {
  // VITE_USE_MOCK_DATA=true  -> services/mockApi.js (localStorage, no network)
  // VITE_USE_MOCK_DATA=false -> services/api.js talks to the FastAPI backend
  useMockData: toBool(import.meta.env.VITE_USE_MOCK_DATA, true),
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
  currencyCode: 'ZMW',
  mockLatencyMs: 350,
};
