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
     * @property {string} token      - Auth token to send with request
     */
    /**
     * Default XHROptions
     */
    static get XHR_DEFAULTS() {
      return {
        type: 'GET',
        url: 'https://api.nebenan.de/api/v2',
        token: ''
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

      if (!options) {
        throw new SyntaxError('First argument must be an XHROptions object.');
      }

      return new Promise((resolve, reject) => {

        // request object
        let xhr = new XMLHttpRequest();

        // response handler
        xhr.onreadystatechange = function() {
          if (this.readyState === 4) {
            resolve(this.response);
          }
        };

        // error handler
        xhr.onerror = (err) => {
          xhr.abort();
          reject(err);
        };

        // open connection
        xhr.open(options.type, options.url);

        // set request headers
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-AUTH-TOKEN', options.token);

        // send
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
    static getCounterStats(token) {
      let xhrOptions = APIClient.XHR_DEFAULTS;
      xhrOptions.url += '/profile/counter_stats.json';
      xhrOptions.token = token;
      return APIClient.callAPI(xhrOptions);
    }
  };

  return APIClient;

});
