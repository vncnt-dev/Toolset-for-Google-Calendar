import { storage } from '@extend-chrome/storage';
import { CalEvent } from '../../interfaces/eventInterface';

var xhrEventDataCache = new Map<string, CalEvent>();

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
