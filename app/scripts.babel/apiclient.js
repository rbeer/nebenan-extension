'use strict';

define(() => {
  /**
   * @class Client to nebenan.de API
   */
  class APIClient {

    constructor() {
      this.options = APIClient.XHR_DEFAULTS;
    }

    /**
     * @typedef {XHROptions}
     * @memberOf APIClient
     * @static
     * @property {string} type       - Request type, e.g. `'GET', 'POST'`
     * @property {string} url        - API endpoint URL to call
     * @property {bool}   needsToken - Whether to check for and send along auth token.
     */
    /**
     * Default XHROptions
     */
    static get XHR_DEFAULTS() {
      return {
        type: 'GET',
        url: 'https://api.nebenan.de/',
        needsToken: false
      };
    }

    /**
     * Executes XMLHttpRequest
     * @memberOf APIClient
     * @static
     * @param {?APIClient.XHROptions} options - Options passed to XMLHttpRequest
     * @return {Promise}
     */
    static callAPI(options) {

      options = options || APIClient.XHR_DEFAULTS;

      return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (this.readyState === 4) {
            resolve(this.response);
          }
        };
        xhr.onerror = (err) => {
          xhr.abort();
          reject(err);
        };
        xhr.open(options.type, options.url);
        xhr.send();
      });
    }

    /**
     * Requests counter_stats.json
     * @see APIClient.callAPI
     * @memberOf APIClient
     * @static
     * @return {Promise}
     */
    static getCounterStats() {}
  };

  return APIClient;

});
