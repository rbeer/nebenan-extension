
define([
  'bg/cache/nstatus-cache',
  'bg/cache/nitem-cache',
  'bg/cache/pcitem-cache',
  'bg/apiclient/nsubset',
  'bg/storage'
], (NStatusCache, NItemCache, PCItemCache, NSubset, storage) => {
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
    return storage.read('caches').then((storeObjs) => {
      devlog('stored caches:', storeObjs);
    });
  };

  cache.persist = () => storage.write('caches', cache.stores);

  cache.cacheSubsets = (dataSets) => {

    let addToCache = (dataSet) => {
      let dataType = dataSet.SUBSET_TYPE;
      let cacheKey = dataType.toLowerCase();
      if (cache.stores[cacheKey]) {
        devlog('Adding to:', dataType);
        cache.stores[cacheKey].add(dataSet);
      } else {
        devlog('Creating cache for:', dataType);
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
