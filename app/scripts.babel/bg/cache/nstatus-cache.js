define([
  'bg/cache/nsubset-cache',
  'bg/apiclient/nstatus'
], (NSubsetCache, NStatus) => {
  'use strict';
  /**
   * @class Cache for counter_stats.json data
   * @memberOf module:bg/cache
   * @extends {module:bg/cache.NSubsetCache}
   */
  class NStatusCache extends NSubsetCache {
    constructor(dataSet, lastUpdate) {
      super(dataSet, lastUpdate);
      this.expiresIn = 0;
    }

    static parseFromStorage(stored) {
      return NSubsetCache.parseFromStorage(stored, NStatusCache, NStatus);
    }

    /**
     * Always returns `false`, as NStatus' have no particular identifier
     * @implements {module:bg/cache.NSubsetCache#isDuplicate}
     * @return {Boolean} Always `false`
     */
    isDuplicate() {
      return false;
    }
  }

  return NStatusCache;
});
