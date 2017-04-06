'use strict';

define(() => {

  /**
   * @class Cached data from API requests
   */
  class RequestCache {
    constructor(data, lastUpdate) {
      /**
       * Data, sanitized for internal use
       * @type {Object}
       */
      this.sanitized = data;
      /**
       * UNIX epoch tstamp (ms) of last successfull API call
       * @type {Number}
       */
      this.lastUpdate = lastUpdate;
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

    get data() {
      return this.sanitized;
    }
    set data(v) {
      this.sanitized = StatsCache.sanitizeStats(v);
      this.lastUpdate = Date.now();
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
      return stats;
    }

  }

  return RequestCache;

});
