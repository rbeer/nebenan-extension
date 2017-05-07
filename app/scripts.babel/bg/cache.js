
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
    types: {
      NStatusCache: NStatusCache,
      NItemCache: NItemCache,
      PCItemCache: PCItemCache
    },
    stores: {
      nstatus: null,
      nitem: null,
      pcitem: null
    }
  };

  cache.init = () => {
    let readParsePromises = Object.keys(cache.types).map((cacheKey) => {
      return new Promise((resolve) => resolve(storage.read(cacheKey)));
    });
    return Promise.all(readParsePromises).then(cache.parseFromStorage);
  };

  cache.parseFromStorage = (storeObjs) => {
    devlog('Stored caches:', storeObjs);
    storeObjs = storeObjs.filter((store) => !!store);
    storeObjs.forEach((storeObj) => {
      let storeKey = storeObj.CACHE_TYPE.replace('Cache', '').toLowerCase();
      cache.stores[storeKey] = cache.types[storeObj.CACHE_TYPE].parseFromStorage(storeObj);
    });
  };

  cache.persist = (store) => storage.write(store.CACHE_TYPE, store);

  cache.hasStore = (storeKey) => cache.stores[storeKey] instanceof NSubsetCache;

  cache.cacheSubsets = (dataSets) => {
    let workingSets = dataSets instanceof Array ? dataSets : [ dataSets ];
    let dataType = workingSets[0].SUBSET_TYPE;
    let storeKey = dataType.toLowerCase();

    let addCachingPromise = (dataSet) => {
      return new Promise((resolve) => {
        if (cache.stores[storeKey]) {
          let overflown = cache.stores[storeKey].add(dataSet);
          resolve(overflown.length > 0 ? overflown : null);
        } else {
          cache.stores[storeKey] = new cache.types[dataType + 'Cache'](dataSet, Date.now());
          resolve(null);
        }
      });
    };

    let handleOverflow = (results) => {
      let overflown = results.filter((set) => !!set);
      if (overflown.length > 0) {
        storage.writeSubsets(overflown);
      } else {
        devlog('No overflown sets to write.');
      }
    };

    let cachingPromises = workingSets.map(addCachingPromise);
    return Promise.all(cachingPromises)
                  .then(handleOverflow)
                  .then(() => cache.persist(cache.stores[storeKey]))
                  .then(() => dataSets);
  };

  /**
   * Returns last entry of a cache
   * @param  {String} storeType - Key of *Cache instance in cache.stores
   * @memberOf module:bg/cache
   * @return {APIClient.NSubset}
   */
  cache.getLast = (storeType) => cache.stores[storeType].last;

  /**
   * Returns `n` sets from a cache of `storeType`, beginning at index `start` (including).
   * @param  {String} storeType    - Key of *Cache instance in cache.stores
   * @param  {Number} n=7          - \# of sets to return
   * @param  {Number} start=0      - Index to start return sets at
   * @memberOf module:bg/cache
   * @return {APIClient.NSubset}
   */
  cache.get = (storeType, n, start) => {
    n = !isNaN(n) ? n : 7;
    start = !isNaN(start) ? start : 0;
    return cache.stores[storeType].get(n, start);
  };

  return cache;

});
