export type Entry = {
  id: string;
  number: number;
  createdAt: number;
  duration: number;
  mimeType: string;
  videoBlob: Blob;
  thumbnailBlob: Blob;
  prompt: string | null;
};

const DB_NAME = 'diary';
const DB_VERSION = 1;
const STORE = 'entries';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addEntry(entry: Entry): Promise<void> {
  const store = await tx('readwrite');
  await reqToPromise(store.add(entry));
}

export async function listEntries(): Promise<Entry[]> {
  const store = await tx('readonly');
  const all = await reqToPromise(store.getAll() as IDBRequest<Entry[]>);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteEntry(id: string): Promise<void> {
  const store = await tx('readwrite');
  await reqToPromise(store.delete(id));
}

export async function nextEntryNumber(): Promise<number> {
  const entries = await listEntries();
  if (entries.length === 0) return 1;
  return Math.max(...entries.map((e) => e.number ?? 0)) + 1;
}

export async function storageUsedMB(): Promise<number | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage } = await navigator.storage.estimate();
  if (usage == null) return null;
  return Math.round((usage / 1024 / 1024) * 10) / 10;
}
