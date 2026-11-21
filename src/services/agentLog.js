const STORAGE_KEY = 'zedbiz-lens:agent-events:v1';
const MAX_EVENTS = 100;
let storageScope = 'guest';
const scopedKey = () => `${STORAGE_KEY}:${storageScope}`;

export function setAgentLogScope(userId = 'guest') {
  storageScope = String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function readEvents() {
  try {
    const value = JSON.parse(localStorage.getItem(scopedKey()) || '[]');
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === 'string') : [];
  } catch {
    return [];
  }
}

export function recordAgentEvent({ businessId, type, message, intent = null }) {
  const event = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    businessId,
    type,
    intent,
    message: String(message).slice(0, 120),
    createdAt: new Date().toISOString(),
    synthetic: false,
  };
  try {
    const events = readEvents();
    localStorage.setItem(scopedKey(), JSON.stringify([event, ...events].slice(0, MAX_EVENTS)));
  } catch {
    // Logging must never block the user's business workflow.
  }
  return event;
}

export function getAgentEvents(businessId, limit = 8) {
  return readEvents().filter((event) => event.businessId === businessId).slice(0, limit);
}

export function getSampleAgentEvents(businessName = 'Demo business') {
  const now = Date.now();
  return [
    { id: 'sample-1', type: 'draft', intent: 'sale', message: `Prepared a synthetic sale note for ${businessName}; owner review required.`, createdAt: new Date(now - 1000 * 60 * 22).toISOString(), synthetic: true },
    { id: 'sample-2', type: 'summary', intent: 'summary', message: 'Built a sample 30-day sales and expense summary from the demo ledger.', createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(), synthetic: true },
    { id: 'sample-3', type: 'guardrail', intent: null, message: 'Held a tax-liability question for human review; no filing estimate was produced.', createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(), synthetic: true },
  ];
}

export function clearAgentEvents() {
  try { localStorage.removeItem(scopedKey()); } catch { /* local history is optional */ }
}

