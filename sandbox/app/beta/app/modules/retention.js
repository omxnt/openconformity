/**
 * The browser's retention of the open project between sessions: one
 * small asynchronous interface over IndexedDB, whose quota is a share of
 * the disk rather than the few megabytes web storage allows, so a
 * project with many drawings keeps being kept. Two records live in one
 * object store, the project blob and the set-aside copy of one that
 * failed to load. The interface also asks the browser to keep the data
 * through storage pressure and reports how full the origin's storage
 * is. An in-memory twin serves the tests, and any browser without
 * IndexedDB, where every write is refused and the store says so.
 */

/** The database and its one object store. */
const DATABASE = 'openconformity';
const STORE = 'retention';
const VERSION = 1;

/**
 * @typedef {Object} Retention
 * @property {(key: string) => Promise<unknown|null>} read  the record, or null
 * @property {(key: string, value: unknown) => Promise<void>} write  rejects where the browser refuses
 * @property {(keys: string[]) => Promise<void>} remove
 * @property {() => Promise<{ usage: number, quota: number }|null>} estimate  how full the origin's storage is, or null where the browser does not say
 * @property {() => Promise<boolean>} persist  ask the browser to keep the origin's storage through storage pressure
 */

/**
 * Retention over the browser's IndexedDB.
 * @param {Object} context
 * @param {IDBFactory|undefined} context.indexedDB  the browser's, or undefined where there is none
 * @param {{ estimate?: () => Promise<{ usage?: number, quota?: number }>, persist?: () => Promise<boolean> }|null} [context.storageManager]  navigator.storage, or null
 * @returns {Retention}
 */
export function createRetention({ indexedDB, storageManager = null }) {
  /** @type {Promise<IDBDatabase>|null} the one open connection, dropped on failure so the next call tries again */
  let opening = null;

  function open() {
    if (opening !== null) return opening;
    opening = new Promise((resolve, reject) => {
      if (!indexedDB) {
        reject(new Error('IndexedDB is not available'));
        return;
      }
      let request;
      try {
        request = indexedDB.open(DATABASE, VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          opening = null;
        };
        resolve(database);
      };
      request.onerror = () => reject(request.error ?? new Error('IndexedDB refused to open'));
      request.onblocked = () => reject(new Error('IndexedDB is blocked'));
    });
    opening.catch(() => {
      opening = null;
    });
    return opening;
  }

  /**
   * One transaction over the store, resolved with the request's result
   * once the transaction completes, so a write is durable when it resolves.
   * @param {'readonly'|'readwrite'} mode
   * @param {(objects: IDBObjectStore) => IDBRequest|null} act
   */
  function transact(mode, act) {
    return open().then(
      (database) =>
        new Promise((resolve, reject) => {
          let transaction;
          try {
            transaction = database.transaction(STORE, mode);
          } catch (error) {
            reject(error);
            return;
          }
          let result;
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = () => reject(transaction.error ?? new Error('the transaction failed'));
          transaction.onabort = () => reject(transaction.error ?? new Error('the transaction was aborted'));
          const request = act(transaction.objectStore(STORE));
          if (request) {
            request.onsuccess = () => {
              result = request.result;
            };
          }
        })
    );
  }

  return {
    read: (key) => transact('readonly', (objects) => objects.get(key)).then((value) => (value === undefined ? null : value)),
    write: (key, value) => transact('readwrite', (objects) => objects.put(value, key)).then(() => undefined),
    remove: (keys) =>
      transact('readwrite', (objects) => {
        for (const key of keys) objects.delete(key);
        return null;
      }).then(() => undefined),
    estimate: () =>
      typeof storageManager?.estimate === 'function'
        ? storageManager
            .estimate()
            .then((held) => ({ usage: held?.usage ?? 0, quota: held?.quota ?? 0 }))
            .catch(() => null)
        : Promise.resolve(null),
    persist: () => (typeof storageManager?.persist === 'function' ? storageManager.persist().catch(() => false) : Promise.resolve(false)),
  };
}

/**
 * Retention over a Map, for the tests and for a store built without a
 * browser: records readable from outside, a switch that makes writes
 * fail, a settable estimate, and a count of persistence requests.
 * @param {Object} [context]
 * @param {Object<string, unknown>} [context.initial]
 * @param {{ usage: number, quota: number }|null} [context.estimate]
 */
export function memoryRetention({ initial = {}, estimate = null } = {}) {
  const records = new Map(Object.entries(initial));
  const held = {
    failing: false,
    records,
    estimated: estimate,
    persisted: 0,
    read: async (key) => (records.has(key) ? structuredClone(records.get(key)) : null),
    async write(key, value) {
      if (held.failing) throw new Error('quota');
      records.set(key, structuredClone(value));
    },
    async remove(keys) {
      for (const key of keys) records.delete(key);
    },
    estimate: async () => held.estimated,
    async persist() {
      held.persisted += 1;
      return true;
    },
  };
  return held;
}
