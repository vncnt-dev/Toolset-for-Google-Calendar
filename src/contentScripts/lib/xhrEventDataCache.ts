import { storage } from '@extend-chrome/storage';
import { CalEvent } from '../../interfaces/eventInterface';

var xhrEventDataCache = new Map<string, CalEvent>();

/* const loadXhrEventDataCache = () => {
  console.log('GC Tools - loadXhrEventDataCache');
  return storage.sync.get('gcalXhrEventDataCache').then((e) => {
    xhrEventDataCache = new Map<string, CalEvent>(Object.entries(e.gcalXhrEventDataCache)) || new Map<string, CalEvent>();
  });
}; */

/* const saveXhrEventDataCache = (): Promise<boolean> => {
  // print Map
  console.log('GC Tools - xhrEventDataCache', xhrEventDataCache);

  return storage.sync
    .set({ gcalXhrEventDataCache: Object.fromEntries(xhrEventDataCache) })
    .then((e) => {
      return true;
    })
    .catch((error) => {
      console.warn('GC Tools - xhrEventDataCache save error: ', error);
      return false;
    });
}; */

const getCachedEvents = () => {
  return xhrEventDataCache;
};

const resetCache = () => {
  xhrEventDataCache = new Map<string, CalEvent>();
};

const getItemFromCache = (key: string): CalEvent | undefined => {
  return xhrEventDataCache.get(key);
};

const setItemInCache = (key: string, value: CalEvent) => {
  if (!value || !key) return;
  xhrEventDataCache.set(key, value);
};

export { getCachedEvents, resetCache, getItemFromCache, setItemInCache };
