const keyFor = (kind, userId, businessId) => `zedbiz-lens:${kind}:v1:${String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_')}:${String(businessId || 'my-business').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch { return fallback; }
}

export const operationsStore = {
  listInventory(userId, businessId) {
    const items = read(keyFor('inventory', userId, businessId), []);
    return Array.isArray(items) ? items : [];
  },
  saveInventory(userId, businessId, items) {
    localStorage.setItem(keyFor('inventory', userId, businessId), JSON.stringify(items.slice(0, 50)));
  },
  getCashClose(userId, businessId, date) {
    return read(keyFor('cash-close', userId, businessId), null)?.date === date ? read(keyFor('cash-close', userId, businessId), null) : null;
  },
  saveCashClose(userId, businessId, close) {
    localStorage.setItem(keyFor('cash-close', userId, businessId), JSON.stringify(close));
  },
};
