'use strict';

define(() => {

  /**
   * @class Cached data from API requests
   */
  class RequestCache {

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

    static get StatsCache() {
      return StatsCache;
    }
  }

  /**
   * @class Cache for counter_stats.json
   * @memberOf RequestCache
   * @extends {RequestCache}
   */
  class StatsCache extends RequestCache {
    constructor(rawData, lastUpdate) {
      super(StatsCache.sanitizeStats(rawData), lastUpdate);
    }

    /**
     * Sanitized counter_stats.json from API
     * @property {object} data               - Response data
     * @property {number} data.messages      - \# of unread messages
     * @property {number} data.notifications - \# of unread notifications (i.e. feed activity)
     * @property {number} data.users         - \# of 'active' users
     * @property {number} data.all           - messages + notifications (for display on browserAction badge)
     * @property {number} lastUpdate         - epoch timestamp of last API request
     * @todo - There is some error-indicating field in counter_stat.json if one is thrown; it will be inherited in module:bg/app.sanitizeStats and can be used (name tdb)
     *       - New property discovered @ 17/03/28: 'house_group_user_ids' is an Array.<number>, holding id's of online people from ones own apartment house?
     * @type {Object}
     * @memberOf RequestCache.StatsCache
     */
    get data() {
      return this._data;
    }
    set data(rawData) {
      this._data = StatsCache.sanitizeStats(rawData);
      this.lastUpdate = Date.now() * 1000;
    }

    /**
     * Sanitizes API's counter_stats.json for internal use.
     * - **NOTE**: Mutates passed object.
     * @param  {Object} stats - Parsed counter_stats.json
     * @memberOf RequestCache.StatsCache
     * @returns {Object} Sanitized input
     */
    static sanitizeStats(stats) {
      let nameMap = [
        [ 'users', 'hood_active_users_count' ],
        [ 'messages', 'new_messages_count' ],
        [ 'notifications', 'new_notifications_count' ]
      ];
      nameMap.forEach((namePair) => {
        stats[namePair[0]] = parseInt(stats[namePair[1]], 10);
        delete stats[namePair[1]];
      });
      stats.crx_sanitized = true;
      return stats;
    }

  }

  return RequestCache;

});
