
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

  cache.cacheSubset = (dataSet) => {
    if (!(dataSet instanceof NSubset)) {
      throw new TypeError('Expected 1st parameter to be instanceof StatusCache');
    }
    let dataType = dataSet.SUBSET_TYPE;
    devlog('dataSet_TYPE:', dataType);
    if (cache[dataType.toLowerCase()]) {
      cache[dataType.toLowerCase()].add(dataSet);
    } else {
      cache[dataType.toLowerCase()] = new cache[dataType + 'Cache'](dataSet, Date.now());
    }
  };

  return cache;

});
