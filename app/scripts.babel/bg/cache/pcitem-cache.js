define([
  'bg/cache/nsubset-cache',
  'bg/apiclient/messages/pcitem',
  'lodash'
], (NSubsetCache, PCItem, _) => {
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

    static parseFromStorage(stored) {
      return NSubsetCache.parseFromStorage(stored, PCItemCache, PCItem);
    }
  }

  return PCItemCache;
});
