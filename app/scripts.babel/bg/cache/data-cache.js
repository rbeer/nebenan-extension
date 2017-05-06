define(['bg/apiclient/nsubset'], (NSubset) => {
  'use strict';
  /**
   * @class Cached data from API requests
   * @memberOf module:bg/cache
   */
  class SubsetCache {

    /**
     * Creates new cache
     * @param  {APIClient.NSubset} dataSet    - NSubset based Object to cache.
     * @param  {number}            lastUpdate - UNIX epoch tstamp (in microseconds!) of last successfull API call
     * @return {SubsetCache}
     */
    constructor(dataSet, lastUpdate) {
      if (dataSet instanceof NSubset) {
        throw new TypeError('First parameter must be an instance of APIClient.NSubset');
      }
      this.CACHE_TYPE = this.constructor.name;
      /**
       * Data, sanitized for internal use; treated
       * @type {Array.<APIClient.NSubset>}
       * @memberOf module:bg/cache.SubsetCache
       */
      this.dataSet = dataSet;
      /**
       * UNIX epoch tstamp (in microseconds!) of last successfull API call
       * @type {Number}
       * @memberOf module:bg/cache.SubsetCache
       */
      this.lastUpdate = lastUpdate / 10000000000000 > 0 ? lastUpdate : lastUpdate * 1000;

      /**
       * Cache expiration timeout in (API compliant) microseconds
       * @type {Number}
       * @memberOf module:bg/cache.SubsetCache
       */
      this.expiresIn = 5 * 60000000;
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
  }

  return SubsetCache;
});
