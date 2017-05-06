define(['bg/cache/data-cache'], (SubsetCache) => {
  'use strict';
  /**
   * @class Cache for counter_stats.json
   * @memberOf module:bg/cache
   * @extends {module:bg/cache.SubsetCache}
   */
  class StatusCache extends SubsetCache {
    constructor(dataSet, lastUpdate) {
      super(dataSet, lastUpdate);
    }
  }

  return StatusCache;
});
