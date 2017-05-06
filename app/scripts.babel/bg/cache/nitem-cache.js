define([
  'bg/cache/nsubset-cache',
  'bg/apiclient/notifications/nitem'
], (NSubsetCache, NItem) => {
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

    static parseFromStorage(stored) {
      return NSubsetCache.parseFromStorage(stored, NItemCache, NItem);
    }
  }

  return NItemCache;
});
