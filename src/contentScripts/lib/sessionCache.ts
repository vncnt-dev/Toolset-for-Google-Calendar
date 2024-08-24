import { GctSessionCache } from '../../interfaces/gctSessionCache';

let sessionCache: GctSessionCache = {};

const resetCache = () => {
  sessionCache = {};
};

const getItemFromCache = <T extends keyof GctSessionCache>(key: T): GctSessionCache[T] => {
  return sessionCache[key];
};

const setItemInCache = <T extends keyof GctSessionCache>(key: T, value: GctSessionCache[T]) => {
  sessionCache[key] = value;
};

export { sessionCache as default, resetCache, getItemFromCache, setItemInCache };
