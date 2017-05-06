define(['bg/cache/nsubset-cache'], (NSubsetCache) => {
  'use strict';
  /**
   * @class Cache for private_conversations.json data
   * @memberOf module:bg/cache
   * @extends {module:bg/cache.NSubsetCache}
   */
  class PCItemCache extends NSubsetCache {
    constructor(dataSet, lastUpdate) {
      super(dataSet, lastUpdate);
    }
  }

  return PCItemCache;
});
