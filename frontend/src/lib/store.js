import { useSyncExternalStore } from "react";

const KEYS = { obtained: "d2_obtained", favItems: "d2_fav_items", favActs: "d2_fav_activities" };

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function write(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }

let cache = {
  obtained: read(KEYS.obtained),
  favItems: read(KEYS.favItems),
  favActs: read(KEYS.favActs),
};

const listeners = new Set();
function emit() { cache = { ...cache }; listeners.forEach((l) => l()); }
function subscribe(l) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return cache; }

export function useStore() { return useSyncExternalStore(subscribe, getSnapshot); }

function toggleIn(key, cacheKey, id) {
  const arr = [...cache[cacheKey]];
  const idx = arr.indexOf(id);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(id);
  cache[cacheKey] = arr;
  write(key, arr);
  emit();
  return idx < 0; // true if now added
}

export const toggleObtained = (hash) => toggleIn(KEYS.obtained, "obtained", hash);
export const toggleFavItem = (hash) => toggleIn(KEYS.favItems, "favItems", hash);
export const toggleFavActivity = (id) => toggleIn(KEYS.favActs, "favActs", id);

export function setManyObtained(hashes, obtained) {
  const set = new Set(cache.obtained);
  hashes.forEach((h) => (obtained ? set.add(h) : set.delete(h)));
  cache.obtained = [...set];
  write(KEYS.obtained, cache.obtained);
  emit();
}

export function clearObtained() {
  cache.obtained = [];
  write(KEYS.obtained, []);
  emit();
}
