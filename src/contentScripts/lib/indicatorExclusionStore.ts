import { strToU8, strFromU8, deflateSync, inflateSync } from 'fflate';
import { logging } from './logger';

/**
 * Store for events that should NOT get an "Indicate All- and Multi-Day Events" indicator.
 *
 * - single sync-storage entry ("gct_indicatorExclusions") holding a JSON list,
 *   compressed with raw deflate and base64 encoded to stay within the 8KB item quota
 * - the list is managed in memory (snapshot), writes are debounced
 * - recurring events can be excluded as whole series ("series") or single occurrence ("occurrence")
 * - entries carry the end of their (last) occurrence; events that ended more than
 *   PRUNE_AFTER_MS (~6 months) ago are pruned on load/save. For series the end of the
 *   recurrence counts; entries without a determinable end are never pruned.
 */

export const INDICATOR_EXCLUSIONS_STORAGE_KEY = 'gct_indicatorExclusions';

export type IndicatorExclusionScope = 'single' | 'series' | 'occurrence';

export interface IndicatorExclusionEntry {
  /** eventId, seriesId or "<seriesId>_<occurrenceToken>" (same format as google's exception keys) */
  id: string;
  scope: IndicatorExclusionScope;
  /** event name for the options page management list, trimmed */
  n?: string;
  /** when this exclusion was created (ms since epoch) */
  ts: number;
  /** start of the (first) occurrence, for display on the options page */
  s?: number;
  /**
   * end of the excluded (last) occurrence in ms since epoch - pruning basis:
   * single/occurrence = event end date, series = end of the recurrence (UNTIL/COUNT).
   * entries without a determinable end (e.g. infinite series) are never pruned.
   */
  end?: number;
  /** short recurrence summary f.e. "WEEKLY" (series only) */
  r?: string;
}

export interface IndicatorExclusionInput {
  id: string;
  scope: IndicatorExclusionScope;
  name?: string;
  /** start of the (first) occurrence */
  startDate?: number;
  /** end of the (last) occurrence - pruning basis */
  endDate?: number;
  /** short recurrence summary f.e. "WEEKLY" */
  rule?: string;
}

const PAYLOAD_VERSION = 2;
const MAX_ENTRIES = 150;
const NAME_MAX_LENGTH = 40;
/** ~6 months */
const PRUNE_AFTER_MS = 182 * 24 * 60 * 60 * 1000;
/** debounce window for storage.sync writes */
const SAVE_DEBOUNCE_MS = 1000;

let exclusions: IndicatorExclusionEntry[] = [];
let loadPromise: Promise<void> | undefined;
let saveTimer: NodeJS.Timeout | null = null;

/* ------------------------------------------------------------------ */
/* base64 helpers                                                      */
/* ------------------------------------------------------------------ */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000; // avoid call stack overflow with String.fromCharCode.apply
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/* ------------------------------------------------------------------ */
/* (de)serialization                                                   */
/* ------------------------------------------------------------------ */

interface StoragePayload {
  v: number;
  /** base64 encoded, raw-deflate compressed JSON list */
  d?: string;
  /** plain fallback (v1 / uncompressed) */
  items?: IndicatorExclusionEntry[];
}

function encodePayload(items: IndicatorExclusionEntry[]): StoragePayload {
  const json = JSON.stringify({ items });
  return { v: PAYLOAD_VERSION, d: bytesToBase64(deflateSync(strToU8(json))) };
}

function decodePayload(payload: StoragePayload | undefined | null): IndicatorExclusionEntry[] {
  if (!payload) return [];
  try {
    if (payload.v === PAYLOAD_VERSION && typeof payload.d === 'string') {
      const json = strFromU8(inflateSync(base64ToBytes(payload.d)));
      const parsed = JSON.parse(json);
      return Array.isArray(parsed?.items) ? parsed.items : [];
    }
    // fallback: plain/uncompressed list from an older version
    if (Array.isArray(payload.items)) return payload.items;
  } catch (error) {
    logging('error', 'indicatorExclusionStore: failed to decode payload', error);
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* pruning                                                             */
/* ------------------------------------------------------------------ */

function pruneEntries(items: IndicatorExclusionEntry[]): IndicatorExclusionEntry[] {
  const cutoff = Date.now() - PRUNE_AFTER_MS;
  // only entries with a known end date expire; entries without one (f.e. infinite series) stay forever
  return items.filter((entry) => entry.end === undefined || entry.end >= cutoff);
}

/* ------------------------------------------------------------------ */
/* storage access                                                      */
/* ------------------------------------------------------------------ */

async function readFromStorage(): Promise<IndicatorExclusionEntry[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) return [];
  try {
    const result = await chrome.storage.sync.get(INDICATOR_EXCLUSIONS_STORAGE_KEY);
    let items = decodePayload(result[INDICATOR_EXCLUSIONS_STORAGE_KEY] as StoragePayload | undefined);
    const pruned = pruneEntries(items);
    if (pruned.length !== items.length) {
      logging('info', `indicatorExclusionStore: pruned ${items.length - pruned.length} entries older than 6 months`);
      items = pruned;
      // persist pruning result without awaiting it
      void writeToStorage(items);
    }
    return items;
  } catch (error) {
    logging('error', 'indicatorExclusionStore: failed to load', error);
    return [];
  }
}

async function writeToStorage(items: IndicatorExclusionEntry[]): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) return false;
  try {
    await chrome.storage.sync.set({ [INDICATOR_EXCLUSIONS_STORAGE_KEY]: encodePayload(items) });
    return true;
  } catch (error) {
    logging('error', 'indicatorExclusionStore: failed to save', error);
    return false;
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    const items = pruneEntries(exclusions);
    const removed = exclusions.length - items.length;
    exclusions = items;
    if (removed > 0) logging('info', `indicatorExclusionStore: pruned ${removed} stale entries before save`);
    await writeToStorage(exclusions);
  }, SAVE_DEBOUNCE_MS);
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */

/** loads the exclusion list into memory (once), resolves when ready */
async function loadIndicatorExclusions(force = false): Promise<void> {
  if (!force && loadPromise) return loadPromise;
  loadPromise = readFromStorage().then((items) => {
    exclusions = items;
  });
  return loadPromise;
}

/** in-memory snapshot, call loadIndicatorExclusions() once beforehand */
function getIndicatorExclusionSnapshot(): IndicatorExclusionEntry[] {
  return exclusions;
}

/**
 * checks whether an event is excluded from the "Indicate All- and Multi-Day Events" feature (pure check, no side effects).
 *
 * @param eventId cache key of the event: plain id (single event / series master) or
 *                "<seriesId>_<occurrenceToken>" (exception)
 * @param occurrenceToken date token of the rendered occurrence (from data-eventid), if any
 */
function isIndicatorExcluded(eventId: string, occurrenceToken?: string): boolean {
  if (!eventId || exclusions.length === 0) return false;

  const hasEntry = (id: string) => exclusions.some((entry) => entry.id === id);

  if (hasEntry(eventId)) return true;

  // exceptions ("<seriesId>_<date>") also match their series-level exclusion
  const underscoreIndex = eventId.indexOf('_');
  if (underscoreIndex !== -1 && hasEntry(eventId.slice(0, underscoreIndex))) return true;

  // occurrences of a series match "<seriesId>_<occurrenceToken>" exclusions
  if (occurrenceToken && hasEntry(`${eventId}_${occurrenceToken}`)) return true;

  return false;
}

/** adds or replaces an exclusion, saves debounced */
async function addIndicatorExclusion(input: IndicatorExclusionInput): Promise<boolean> {
  await loadIndicatorExclusions();
  const existingIndex = exclusions.findIndex((entry) => entry.id === input.id);
  const entry: IndicatorExclusionEntry = {
    id: input.id,
    scope: input.scope,
    n: input.name ? input.name.slice(0, NAME_MAX_LENGTH) : undefined,
    ts: Date.now(),
    s: input.startDate,
    end: input.endDate,
    r: input.rule,
  };
  if (existingIndex !== -1) {
    exclusions[existingIndex] = entry;
  } else {
    if (exclusions.length >= MAX_ENTRIES) {
      logging('warn', `indicatorExclusionStore: list is full (${MAX_ENTRIES} entries), not adding: ${input.id}`);
      return false;
    }
    exclusions.push(entry);
  }
  scheduleSave();
  return true;
}

/** removes a single exclusion by id, saves debounced */
async function removeIndicatorExclusion(id: string): Promise<void> {
  await removeIndicatorExclusions([id]);
}

/** removes multiple exclusions by id in one save cycle */
async function removeIndicatorExclusions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await loadIndicatorExclusions();
  const idSet = new Set(ids);
  const next = exclusions.filter((entry) => !idSet.has(entry.id));
  if (next.length !== exclusions.length) {
    exclusions = next;
    scheduleSave();
  }
}

/** full list for e.g. the options page (works in every extension context) */
async function getAllIndicatorExclusions(): Promise<IndicatorExclusionEntry[]> {
  await loadIndicatorExclusions();
  return [...exclusions];
}

export {
  loadIndicatorExclusions,
  getIndicatorExclusionSnapshot,
  isIndicatorExcluded,
  addIndicatorExclusion,
  removeIndicatorExclusion,
  removeIndicatorExclusions,
  getAllIndicatorExclusions,
};
