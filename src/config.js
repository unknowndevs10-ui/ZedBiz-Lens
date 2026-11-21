// Single place for runtime configuration. Components never read import.meta.env directly.
const toBool = (value, fallback) =>
  value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true';
const env = import.meta.env || {};

export const config = {
  // VITE_USE_MOCK_DATA=true  -> services/mockApi.js (localStorage, no network)
  // VITE_USE_MOCK_DATA=false -> services/api.js talks to the FastAPI backend
  useMockData: toBool(env.VITE_USE_MOCK_DATA, true),
  apiBaseUrl: (env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
  // Optional FastAPI model service; blank keeps the small synthetic model on-device.
  agentApiBaseUrl: (env.VITE_AGENT_API_URL || '').replace(/\/+$/, ''),
  currencyCode: 'ZMW',
  mockLatencyMs: 350,
};
