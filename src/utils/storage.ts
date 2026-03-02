/**
 * Utilitaires de persistance bas niveau.
 * La sauvegarde principale passe par Zustand/persist.
 * Ce fichier sert pour des besoins annexes (stats, config, etc.).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  GAME_SAVE: 'paradise-save',
  SETTINGS: 'paradise-settings',
} as const;

export async function saveJSON<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('[Storage] Échec sauvegarde :', key, err);
  }
}

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error('[Storage] Échec chargement :', key, err);
    return null;
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error('[Storage] Échec suppression :', key, err);
  }
}
