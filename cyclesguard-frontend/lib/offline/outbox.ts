import type { CyclePhase } from '@/lib/types';

const DB_NAME = 'cyclesguard-outbox';
const STORE = 'pending_cycle_logs';
const DB_VERSION = 1;
export const OUTBOX_SYNC_TAG = 'cyclesguard-outbox';

export interface PendingCycleLog {
  clientLogId: string;
  phase: CyclePhase;
  energyLevel?: number;
  symptoms: string[];
  notes?: string;
  createdAt: string;
  synced: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'clientLogId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueLog(
  input: Omit<PendingCycleLog, 'clientLogId' | 'createdAt' | 'synced'>
): Promise<PendingCycleLog> {
  const entry: PendingCycleLog = {
    ...input,
    clientLogId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    synced: false,
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  await registerOutboxSync();
  return entry;
}

/** Ask the browser to retry flush when connectivity returns (Chromium; no-op elsewhere). */
export async function registerOutboxSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const syncManager = (
      reg as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      }
    ).sync;
    if (syncManager) {
      await syncManager.register(OUTBOX_SYNC_TAG);
    }
  } catch {
    // Background Sync unsupported or permission denied — online listener still covers open tabs.
  }
}

export async function listPending(): Promise<PendingCycleLog[]> {
  const db = await openDb();
  const rows = await new Promise<PendingCycleLog[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve((req.result as PendingCycleLog[]).filter((r) => !r.synced));
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows;
}

export async function markSynced(clientLogId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(clientLogId);
    getReq.onsuccess = () => {
      const row = getReq.result as PendingCycleLog | undefined;
      if (row) {
        store.put({ ...row, synced: true });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function flushOutbox(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const pending = await listPending();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const response = await fetch('/api/player/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          clientLogId: entry.clientLogId,
          phase: entry.phase,
          energyLevel: entry.energyLevel,
          symptoms: entry.symptoms,
          notes: entry.notes,
        }),
      });
      if (response.ok || response.status === 409) {
        await markSynced(entry.clientLogId);
        synced += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
