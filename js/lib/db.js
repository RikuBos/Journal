// ============================================================
// INDEXED DB — STORAGE LAYER
// ============================================================
var DB_NAME    = 'FundedTradingJournal';
var DB_VERSION = 1;
const STORES = {
  accounts:       'accounts',
  trades:         'trades',
  journals:       'journals',
  weeklyReviews:  'weeklyReviews',
  monthlyReviews: 'monthlyReviews',
  playbook:       'playbook',
  settings:       'settings',
  mistakes:       'mistakes',
};

var _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach(name => {
        if (!db.objectStoreNames.contains(name))
          db.createObjectStore(name, { keyPath: 'id' });
      });
    };
  });
}

async function dbGet(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(id);
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror  = () => rej(req.error);
  });
}

async function dbPut(store, item) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(item);
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

async function dbDelete(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(id);
    req.onsuccess = () => res();
    req.onerror  = () => rej(req.error);
  });
}

async function dbClear(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).clear();
    req.onsuccess = () => res();
    req.onerror  = () => rej(req.error);
  });
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

window.DB    = { get: dbGet, getAll: dbGetAll, put: dbPut, delete: dbDelete, clear: dbClear };
window.STORES = STORES;
window.genId  = genId;

// ── Global h shorthand ─────────────────────────────────────
// Declared once here (db.js loads first after React CDN).
// All component files call h() as a global without re-declaring.
window.h = React.createElement;
