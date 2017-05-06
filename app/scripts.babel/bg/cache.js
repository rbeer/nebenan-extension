
define([
  'bg/cache/nsubset-cache',
  'bg/cache/nstatus-cache',
  'bg/cache/nitem-cache',
  'bg/cache/pcitem-cache',
  'bg/apiclient/nsubset',
  'bg/storage'
], (NSubsetCache, NStatusCache, NItemCache, PCItemCache, NSubset, storage) => {
  'use strict';
  /**
   * Cache
   * @module bg/cache
   */
  let cache = {
    NStatusCache: NStatusCache,
    NItemCache: NItemCache,
    PCItemCache: PCItemCache,
    stores: {
      nstatus: null,
      nitem: null,
      pcitem: null
    }
  };

  cache.init = () => {
    return storage.read('caches').then(cache.parseFromStorage);
  };

  cache.parseFromStorage = (storeObjs) => {
    devlog('Stored caches:', storeObjs);
    for (let storeKey in storeObjs) {
      let storeObj = storeObjs[storeKey];
      if (cache.hasStore(storeKey)) {
        console.warn('Overwriting', storeKey, 'with stored version.');
      }
      cache.stores[storeKey] = cache[storeObj.CACHE_TYPE].parseFromStorage(storeObj);
    }
    devlog('Parsed caches:', cache.stores);
  };

  cache.persist = () => storage.write('caches', cache.stores);

  cache.hasStore = (storeKey) => cache.stores[storeKey] instanceof NSubsetCache;

  cache.cacheSubsets = (dataSets) => {

    let addToCache = (dataSet) => {
      let dataType = dataSet.SUBSET_TYPE;
      let cacheKey = dataType.toLowerCase();
      if (cache.stores[cacheKey]) {
        cache.stores[cacheKey].add(dataSet);
      } else {
        cache.stores[cacheKey] = new cache[dataType + 'Cache'](dataSet, Date.now());
      }
    };

    if (dataSets instanceof Array) {
      return dataSets.forEach(addToCache);
    }
    return addToCache(dataSets);
  };

  return cache;

});
