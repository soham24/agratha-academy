/* Read-only public data access (no supabase-js needed on public pages). */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

async function get(path, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Loads everything a public page needs in parallel.
 * Returns null if the database can't be reached.
 */
export async function loadPage(page, { timeoutMs = 6000, announcements = false } = {}) {
  try {
    const [settings, sections, anns] = await Promise.all([
      get('aa_settings?select=key,data', timeoutMs),
      get(`aa_sections?select=id,type,anchor,label,data,position&page=eq.${encodeURIComponent(page)}&visible=is.true&order=position.asc`, timeoutMs),
      announcements
        ? get('aa_announcements?select=*&order=pinned.desc,starts_at.desc.nullslast,created_at.desc', timeoutMs)
        : Promise.resolve([]),
    ]);
    const byKey = Object.fromEntries(settings.map((s) => [s.key, s.data]));
    return { settings: byKey, sections, announcements: anns };
  } catch (err) {
    console.warn('[cms] using built-in content:', err.message);
    return null;
  }
}

const CACHE_PREFIX = 'agratha-cms:';

export function readCache(page) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + page);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(page, payload) {
  try {
    localStorage.setItem(CACHE_PREFIX + page, JSON.stringify(payload));
  } catch {
    /* storage full or blocked – ignore */
  }
}
