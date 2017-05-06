define(['bg/cache/nsubset-cache'], (NSubsetCache) => {
  'use strict';
  /**
   * @class Cache for counter_stats.json data
   * @memberOf module:bg/cache
   * @extends {module:bg/cache.NSubsetCache}
   */
  class NStatusCache extends NSubsetCache {
    constructor(dataSet, lastUpdate) {
      super(dataSet, lastUpdate);
    }
  }

  return NStatusCache;
});
