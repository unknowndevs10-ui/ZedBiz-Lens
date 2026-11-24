const DATABASE = 'zedbiz-receipt-archive';
const STORE = 'receipt-images';
let databasePromise;

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser does not support local receipt storage.'));
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local receipt storage.'));
  });
  return databasePromise;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local receipt storage failed.'));
  });
}

export async function saveReceiptPhoto(file, userId) {
  const db = await openDatabase();
  const id = globalThis.crypto?.randomUUID?.() || `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const row = { id, userId: String(userId || 'guest'), name: file.name, type: file.type, savedAt: new Date().toISOString(), blob: file };
  await requestResult(db.transaction(STORE, 'readwrite').objectStore(STORE).put(row));
  return id;
}

export async function getReceiptPhoto(id, userId) {
  if (!id) return null;
  const db = await openDatabase();
  const row = await requestResult(db.transaction(STORE, 'readonly').objectStore(STORE).get(id));
  return row && row.userId === String(userId || 'guest') ? row : null;
}
