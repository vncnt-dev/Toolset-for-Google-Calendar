import { GctCache } from '../../interfaces/cache';

let cache: GctCache = {};

const resetCache = () => {
  cache = {};
};

const getItemFromCache = <T extends keyof GctCache>(key: T): GctCache[T] => {
  return cache[key];
};

const setItemInCache = <T extends keyof GctCache>(key: T, value: GctCache[T]) => {
  cache[key] = value;
};

export { cache as default, resetCache, getItemFromCache, setItemInCache };
