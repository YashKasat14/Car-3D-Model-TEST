export interface RecordingHistoryItem {
  id: string;
  title: string;
  recordingDate: string;
  durationSec: number;
  durationFormatted: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  modelName: string;
  thumbnailUrl?: string;
}

const DB_NAME = 'Aura3D_RecordingsVault_v1';
const DB_VERSION = 1;
const STORE_NAME = 'recording_blobs';
const META_STORAGE_KEY = 'aura_recording_history_meta_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeRecordingBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, blob, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to store recording blob in IndexedDB:', err);
  }
}

export async function getRecordingBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result?.blob || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve recording blob from IndexedDB:', err);
    return null;
  }
}

export async function removeRecordingBlob(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to remove recording blob from IndexedDB:', err);
  }
}

let memoryCache: RecordingHistoryItem[] | null = null;

export function getRecordingHistory(): RecordingHistoryItem[] {
  try {
    if (typeof localStorage === 'undefined') return memoryCache || [];
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return memoryCache || [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load recording history metadata:', err);
    return memoryCache || [];
  }
}

export function saveRecordingHistoryMeta(items: RecordingHistoryItem[]): void {
  memoryCache = items;
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save recording history metadata:', err);
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function saveRecordingToHistory(
  blob: Blob,
  durationSec: number,
  modelName: string,
  customTitle?: string
): Promise<RecordingHistoryItem> {
  const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const dateStr = new Date().toISOString();
  const safeDuration = Math.max(1, durationSec);
  const title = customTitle || `${modelName} Inspection Session`;

  const item: RecordingHistoryItem = {
    id,
    title,
    recordingDate: dateStr,
    durationSec: safeDuration,
    durationFormatted: formatDuration(safeDuration),
    fileSizeBytes: blob.size,
    fileSizeFormatted: formatFileSize(blob.size),
    modelName
  };

  // 1. Store video blob in IndexedDB
  await storeRecordingBlob(id, blob);

  // 2. Append metadata to localStorage
  const existing = getRecordingHistory();
  const updated = [item, ...existing];
  saveRecordingHistoryMeta(updated);

  return item;
}

export async function deleteRecordingFromHistory(id: string): Promise<void> {
  await removeRecordingBlob(id);
  const existing = getRecordingHistory();
  const updated = existing.filter(item => item.id !== id);
  saveRecordingHistoryMeta(updated);
}

export async function downloadRecordingFile(id: string, filename?: string): Promise<boolean> {
  const blob = await getRecordingBlob(id);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `Aura3D_Recording_${id}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
