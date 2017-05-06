
define([
  'bg/cache/nstatus-cache',
  'bg/cache/nitem-cache',
  'bg/cache/pcitem-cache',
  'bg/apiclient/nsubset'
], (NStatusCache, NItemCache, PCItemCache, NSubset) => {
  'use strict';
  /**
   * Cache
   * @module bg/cache
   */
  let cache = {
    NStatusCache: NStatusCache,
    NItemCache: NItemCache,
    PCItemCache: PCItemCache,
    nstatus: null,
    nitem: null,
    pcitem: null
  };

  cache.cacheSubsets = (dataSets) => {

    let addToCache = (dataSet) => {
      let dataType = dataSet.SUBSET_TYPE;
      if (cache[dataType.toLowerCase()]) {
        devlog('Adding to:', dataType);
        cache[dataType.toLowerCase()].add(dataSet);
      } else {
        devlog('Creating cache for:', dataType);
        cache[dataType.toLowerCase()] = new cache[dataType + 'Cache'](dataSet, Date.now());
      }
    };

    if (dataSets instanceof Array) {
      return dataSets.forEach(addToCache);
    }
    return addToCache(dataSets);
  };

  return cache;

});
