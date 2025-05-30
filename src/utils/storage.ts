// utils/storage.ts

export function getParsedLocalStorage<T>(key: string): T | null {
  const value = localStorage.getItem(key);
  if (!value || value === 'undefined' || value === 'null') return null;

  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error(`Failed to parse localStorage item "${key}":`, err);
    return null;
  }
}
