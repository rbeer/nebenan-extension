
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

  cache.persist = (store) => storage.write(store.CACHE_TYPE, store);

  cache.hasStore = (storeKey) => cache.stores[storeKey] instanceof NSubsetCache;

  cache.cacheSubsets = (dataSets) => {
    let workingSets = dataSets instanceof Array ? dataSets : [ dataSets ];
    let dataType = workingSets[0].SUBSET_TYPE;
    let cacheKey = dataType.toLowerCase();

    let addCachingPromise = (dataSet) => {
      return new Promise((resolve) => {
        if (cache.stores[cacheKey]) {
          let overflown = cache.stores[cacheKey].add(dataSet);
          resolve(overflown.length > 0 ? overflown : null);
        } else {
          cache.stores[cacheKey] = new cache[dataType + 'Cache'](dataSet, Date.now());
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
                  .then(() => cache.persist(cache.stores[cacheKey]))
                  .then(() => dataSets);
  };

  return cache;

});
