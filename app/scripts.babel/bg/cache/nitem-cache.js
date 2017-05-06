define(['bg/cache/nsubset-cache'], (NSubsetCache) => {
  'use strict';
  /**
   * @class Cache for notifications.json data
   * @memberOf module:bg/cache
   * @extends {module:bg/cache.NSubsetCache}
   */
  class NItemCache extends NSubsetCache {
    constructor(dataSet, lastUpdate) {
      super(dataSet, lastUpdate);
    }
  }

  return NItemCache;
});
