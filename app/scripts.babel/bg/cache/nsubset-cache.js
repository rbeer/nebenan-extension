define([
  'bg/apiclient/nsubset',
  'lodash'
], (NSubset, _) => {
  'use strict';
  /**
   * @class Cached data from API requests
   * @memberOf module:bg/cache
   */
  class NSubsetCache {

    /**
     * Creates new cache
     * @param  {APIClient.NSubset} dataSet    - NSubset based Object to cache.
     * @param  {number}            lastUpdate - UNIX epoch tstamp (in microseconds!) of last successfull API call
     * @return {NSubsetCache}
     */
    constructor(dataSet, lastUpdate) {
      if (!(dataSet instanceof NSubset)) {
        throw new TypeError('First parameter must be an instance of APIClient.NSubset');
      }
      this.CACHE_TYPE = this.constructor.name;
      /**
       * Maximum length of `this.dataSets`
       * @type {Number}
       */
      this.CACHE_SIZE = 21;
      /**
       * Data, sanitized for internal use; treated
       * @type {Array.<APIClient.NSubset>}
       * @memberOf module:bg/cache.NSubsetCache
       */
      this.dataSets = [ dataSet ];
      /**
       * UNIX epoch timestamp of last addition
       * @type {Number}
       * @memberOf module:bg/cache.NSubsetCache
       */
      this.lastUpdate = lastUpdate;

      /**
       * Cache expiration timeout in ms
       * @type {Number}
       * @memberOf module:bg/cache.NSubsetCache
       */
      this.expiresIn = 5 * 60000;
    }

    /**
     * Returns whether cache has expired or not
     * @type {Bool}
     */
    get hasExpired() {
      let expires = this.lastUpdate + this.expiresIn;
      let expiresIn = expires - Date.now();
      return expiresIn <= 0;
    }

    get last() {
      return this.dataSets[0];
    }

    /**
     * Adds entry on top of list, discards everything beyond `this.CACHE_SIZE`
     * @param {NSubset} dataSet - Any instance of NSubset
     */
    add(dataSet) {
      let overflownSets = [];
      if (!this.isDuplicate(dataSet)) {
        this.dataSets.unshift(dataSet);
        this.lastUpdate = Date.now();
        overflownSets = this.dataSets.splice(this.CACHE_SIZE);
      } else {
        devlog('Omitting duplicate:', dataSet.SUBSET_TYPE);
      }
      return overflownSets;
    }

    /**
     * Returns `true` if `dataSet` is already in `this` cache
     * @param  {NSubset} dataSet - Any instance of NSubset
     * @override
     * @return {Boolean}
     */
    isDuplicate(dataSet) {
      return !!_.find(this.dataSets, { created_at_timestamp: dataSet.created_at_timestamp });
    }

    static parseFromStorage(stored, ExtendingClass, DataSetWrapper) {
      let data = stored.dataSets;
      let restOfCache = data.splice(1);
      let firstInCache = new DataSetWrapper(data[0]);

      let _cache = new ExtendingClass(firstInCache, stored.lastUpdate);
      restOfCache.forEach((dataSetObj) => _cache.add(new DataSetWrapper(dataSetObj)));
      return _cache;
    }
  }

  return NSubsetCache;
});
