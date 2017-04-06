'use strict';

define(() => {

  /**
   * @class Cached data from API requests
   */
  class RequestCache {
    constructor(data, lastUpdate) {
      this.data = data;
      this.lastUpdate = lastUpdate;
    }

    static get StatsCache() {
      return StatsCache;
    }
  }

  class StatsCache extends RequestCache {
    constructor(data, lastUpdate) {
      super(data, lastUpdate);
    }
  }

  return RequestCache;

});
