define(() => {
  'use strict';
  /**
   * @class Cached data from API requests
   */
  class ItemCache {

    /**
     * Creates new cache
     * @param  {object} data       - Sanitized data to cache. Sanitized objects have
     *                               the `crx_sanitized` flag set.
     * @param  {number} lastUpdate - UNIX epoch tstamp (in microseconds!) of last successfull API call
     * @return {RequestCache}
     */
    constructor(data, lastUpdate) {
      if (!data.crx_sanitized) {
        let err = new TypeError('Input data isn\'t sanitized.');
        err.code = 'EDIRTYDATA';
        throw err;
      }
      /**
       * Data, sanitized for internal use
       * @type {Object}
       */
      this._data = data;
      /**
       * UNIX epoch tstamp (in microseconds!) of last successfull API call
       * @type {Number}
       */
      this.lastUpdate = lastUpdate / 10000000000000 > 0 ? lastUpdate : lastUpdate * 1000;

      /**
       * Cache expiration timeout in (API compliant) microseconds
       * @type {Number}
       * @memberOf module:bg/app.requestCaches
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

  return ItemCache;
});
