import { storage } from '@extend-chrome/storage';
import { CalEvent } from '../../interfaces/eventInterface';
import { CustomDateHandler } from './customDateHandler';
import { logging } from './logger';

const STORAGE_PREFIX = 'gct_event_';

interface CacheEntry {
  event: any;
  lastUpdated: number;
}

var xhrEventDataCache = new Map<string, CalEvent>();
var pendingWrites = new Map<string, CalEvent>();
var syncTimeout: NodeJS.Timeout | null = null;

function deserializeEvent(raw: any): CalEvent {
  return {
    ...raw,
    dates: {
      start: new CustomDateHandler(new Date(raw.dates.start.date))
        .setDisableTzCorrection(!!raw.dates.start.disableTzCorrection),
      end: new CustomDateHandler(new Date(raw.dates.end.date))
        .setDisableTzCorrection(!!raw.dates.end.disableTzCorrection)
    }
  };
}

const getCachedEvents = () => {
  return xhrEventDataCache;
};

const resetCache = () => {
  xhrEventDataCache = new Map<string, CalEvent>();
};

const getItemFromCache = (key: string): CalEvent | undefined => {
  return xhrEventDataCache.get(key);
};

const scheduleBackgroundSync = () => {
  if (syncTimeout) return;

  syncTimeout = setTimeout(async () => {
    syncTimeout = null;
    if (pendingWrites.size === 0) return;

    const batch = new Map(pendingWrites);
    pendingWrites.clear();

    try {
      const itemsToSet: { [key: string]: CacheEntry } = {};
      const now = Date.now();

      for (const [key, event] of batch) {
        itemsToSet[`${STORAGE_PREFIX}${key}`] = {
          event,
          lastUpdated: now
        };
      }

      await storage.local.set(itemsToSet);
    } catch (error) {
      logging('error', 'Error syncing events to local storage:', error);
      // Put them back to pending writes to retry next time
      for (const [key, event] of batch) {
        if (!pendingWrites.has(key)) {
          pendingWrites.set(key, event);
        }
      }
      scheduleBackgroundSync();
    }
  }, 1000); // 1 second debounce
};

const setItemInCache = (key: string, value: CalEvent) => {
  if (!value || !key) return;
  xhrEventDataCache.set(key, value);
  pendingWrites.set(key, value);
  scheduleBackgroundSync();
};

const loadEventCacheFromLocalStorage = async () => {
  try {
    const allData = await storage.local.get(null);
    const now = Date.now();
    const keysToRemove: string[] = [];
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const entry = value as CacheEntry;
        if (now - entry.lastUpdated > THIRTY_DAYS_MS) {
          keysToRemove.push(key);
        } else {
          const eventId = key.slice(STORAGE_PREFIX.length);
          try {
            const event = deserializeEvent(entry.event);
            xhrEventDataCache.set(eventId, event);
          } catch (e) {
            logging('error', `Failed to deserialize event ${eventId}:`, e);
          }
        }
      }
    }

    if (keysToRemove.length > 0) {
      await storage.local.remove(keysToRemove);
      logging('info', `Removed ${keysToRemove.length} expired event cache entries from local storage`);
    }
  } catch (error) {
    logging('error', 'Error loading event cache from local storage:', error);
  }
};

export { getCachedEvents, resetCache, getItemFromCache, setItemInCache, loadEventCacheFromLocalStorage };


