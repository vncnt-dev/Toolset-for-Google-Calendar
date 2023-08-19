let cache: { [key: string]: any } = {};

const resetCache = () => {
  cache = {};
};

const getItemFromCache = (key: string) => {
  return cache[key];
};

const setItemInCache = (key: string, value: any) => {
  cache[key] = value;
};

export { cache as default, resetCache, getItemFromCache, setItemInCache };