define(['bg/cache/item-cache'], (ItemCache) => {
  'use strict';
  /**
   * @class Cache for counter_stats.json
   * @memberOf RequestCache
   * @extends {RequestCache}
   */
  class StatsCache extends ItemCache {
    constructor(rawData, lastUpdate) {
      super(StatsCache.sanitizeStats(rawData), lastUpdate);
    }

    /**
     * Sanitized counter_stats.json from API
     * @property {object} data               - Response data
     * @property {number} data.messages      - \# of unread messages
     * @property {number} data.notifications - \# of unread notifications (i.e. feed activity)
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

  return StatsCache;
});
