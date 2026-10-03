import { ModelManifest } from '../types/model';

export interface ModelHistoryItem {
  id: string;
  name: string;
  uploadDate: string;
  fileSizeFormatted: string;
  fileType: string;
  componentCount: number;
  triangleCount: number;
  thumbnailUrl?: string;
  manifest: ModelManifest;
}

const DB_NAME = 'Aura3D_ModelVault_v2';
const DB_VERSION = 1;
const STORE_NAME = 'model_blobs';
const META_STORAGE_KEY = 'aura_model_history_meta_v2';

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

export async function storeModelBlob(id: string, blob: Blob): Promise<void> {
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
    console.warn('Failed to store model blob in IndexedDB:', err);
  }
}

export async function getModelBlob(id: string): Promise<Blob | null> {
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
    console.warn('Failed to retrieve model blob from IndexedDB:', err);
    return null;
  }
}

export async function removeModelBlob(id: string): Promise<void> {
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
    console.warn('Failed to remove model blob from IndexedDB:', err);
  }
}

export function getModelHistory(): ModelHistoryItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load model history:', err);
    return [];
  }
}

export function saveModelHistoryMeta(items: ModelHistoryItem[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save model history metadata:', err);
  }
}

export async function addModelToHistory(
  file: File | Blob,
  fileName: string,
  manifest: ModelManifest,
  thumbnailUrl?: string
): Promise<ModelHistoryItem> {
  const sizeBytes = file.size;
  let formattedSize = `${(sizeBytes / 1024).toFixed(1)} KB`;
  if (sizeBytes >= 1024 * 1024) {
    formattedSize = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Count total triangles from components
  let totalTriangles = 0;
  manifest.components.forEach(c => {
    const tris = c.metadata?.specifications?.['Triangles'];
    if (typeof tris === 'number') totalTriangles += tris;
  });

  const historyItem: ModelHistoryItem = {
    id: manifest.id,
    name: manifest.name,
    uploadDate: new Date().toISOString(),
    fileSizeFormatted: formattedSize,
    fileType: fileName.split('.').pop()?.toUpperCase() || 'GLB',
    componentCount: manifest.components.length,
    triangleCount: totalTriangles,
    thumbnailUrl: thumbnailUrl || generateDefaultThumbnail(manifest.name),
    manifest
  };

  // Store binary in IndexedDB
  await storeModelBlob(manifest.id, file);

  // Update localStorage metadata
  const current = getModelHistory().filter(item => item.id !== manifest.id);
  const updated = [historyItem, ...current];
  saveModelHistoryMeta(updated);

  return historyItem;
}

export async function deleteModelFromHistory(id: string): Promise<void> {
  await removeModelBlob(id);
  const current = getModelHistory();
  const updated = current.filter(item => item.id !== id);
  saveModelHistoryMeta(updated);
}

function generateDefaultThumbnail(name: string): string {
  // Return an SVG data URL with high-tech CAD wireframe styling
  const initials = name.slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
    <rect width="200" height="150" fill="#0c0e15"/>
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2438" stroke-width="0.75"/>
      </pattern>
    </defs>
    <rect width="200" height="150" fill="url(#grid)" />
    <path d="M 40 100 L 100 40 L 160 100 Z" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6"/>
    <circle cx="100" cy="75" r="32" fill="none" stroke="#ef4444" stroke-width="1.8" opacity="0.8"/>
    <text x="100" y="80" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">${initials}</text>
    <text x="100" y="130" fill="#71717a" font-family="monospace" font-size="10" text-anchor="middle">3D CAD MODEL</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
