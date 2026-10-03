import { ModelManifest } from '../types/model';
import { getModelHistory, saveModelHistoryMeta, deleteModelFromHistory } from '../services/modelStorage';

// Preloaded models completely removed per Requirement 5
export const BUILTIN_MODELS: ModelManifest[] = [];

export function getAllModels(): ModelManifest[] {
  const history = getModelHistory();
  return history.map(item => item.manifest);
}

export function getModelById(id: string): ModelManifest | undefined {
  const all = getAllModels();
  return all.find(m => m.id === id);
}

export function saveUserModel(manifest: ModelManifest): void {
  const current = getModelHistory().filter(item => item.id !== manifest.id);
  const historyItem = {
    id: manifest.id,
    name: manifest.name,
    uploadDate: new Date().toISOString(),
    fileSizeFormatted: '1.0 MB',
    fileType: 'GLB',
    componentCount: manifest.components.length,
    triangleCount: 0,
    manifest
  };
  saveModelHistoryMeta([historyItem, ...current]);
}

export function deleteUserModel(id: string): void {
  deleteModelFromHistory(id);
}
