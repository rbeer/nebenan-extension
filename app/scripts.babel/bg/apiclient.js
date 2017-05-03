'use strict';

define([
  'bg/auth',
  'bg/apiclient/notifications/nitem',
  'bg/apiclient/notifications/nmessage',
  'bg/apiclient/notifications/ntype',
  'bg/apiclient/messages/pcitem',
  'bg/apiclient/messages/pcmessage'
], (auth, NItem, NMessage, NType, PCItem, PCMessage) => {
  /**
   * @class Client to nebenan.de API
   */
  class APIClient {

    constructor() {
      this.options = APIClient.XHR_DEFAULTS;
    }

    // sub classes
    static get NItem() {
      return NItem;
    }
    static get NMessage() {
      return NMessage;
    }
    static get NType() {
      return NType;
    }
    static get PCMessage() {
      return PCMessage;
    }
    static get PCItem() {
      return PCItem;
    }

    /**
     * @typedef XHROptions
     * @memberOf APIClient
     * @static
     * @property {string} method - Request method, e.g. `'GET', 'POST'`
     * @property {string} url    - API endpoint URL to call
     * @property {string} token  - Auth token to send with request
     */

    /**
     * Default XHROptions
     */
    static get XHR_DEFAULTS() {
      return {
        method: 'GET',
        url: 'https://api.nebenan.de/api/v2',
        token: ''
      };
    }

    /**
     * Executes XMLHttpRequest
     * @memberOf APIClient
     * @static
     * @param  {!APIClient.XHROptions} options - Options passed to XMLHttpRequest
     * @throws {TypeError} if (!options)
     * @return {Promise}                       - Resolves with response body
     */
    static callAPI(options) {

      if (!options) {
        throw new TypeError('First argument must be an XHROptions object.');
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
        xhr.open(options.method, options.url);

        // set request headers
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-AUTH-TOKEN', options.token);

        // send
        xhr.send();
      });
    }

    /**
     * Requests counter_stats.json
     * @property {?object} cached - Cached data; undefined if API should be called
     * @see APIClient.callAPI
     * @memberOf APIClient
     * @static
     * @return {Promise} - Resolves with response body from APIClient.callAPI
     */
    static getCounterStats(cached) {
      if (cached && !cached.hasExpired) {
        return auth.canAuthenticate().then(() => cached);
      }
      return auth.canAuthenticate()
      .then(() => {
        let xhrOptions = APIClient.XHR_DEFAULTS;
        xhrOptions.url += '/profile/counter_stats.json';
        xhrOptions.token = auth.token;
        return xhrOptions;
      })
      .then(APIClient.callAPI);
    }

    /**
     * Requests notifications.json
     * @param {?Number} perPage=7 - # of notifications to request
     * @param {?Number} lower     - UNIX epoch timestamp, ms precision; request only
     *                              notifications older than this value
     * @memberOf APIClient
     * @static
     * @see APIClient.callAPI
     * @return {Promise} - Resolves with the response body APIClient.callAPI resolved with
     */
    static getNotifications(perPage, lower, cached) {
      if (cached || typeof lower === 'object') {
        return auth.canAuthenticate().then(() => cached || lower);
      }
      perPage = perPage || 7;
      return auth.canAuthenticate().then(() => {
        let xhrOptions = APIClient.XHR_DEFAULTS;
        xhrOptions.url += '/notifications.json?per_page=' + perPage;
        if (lower) {
          xhrOptions.url += '&lower=' + lower;
        }
        xhrOptions.token = auth.token;
        return xhrOptions;
      }).then(APIClient.callAPI);
    }

    static getConversations(perPage, page, cached) {
      if (cached || typeof page === 'object') {
        return auth.canAuthenticate().then(() => cached || page);
      }
      perPage = perPage || 7;
      return auth.canAuthenticate().then(() => {
        let xhrOptions = APIClient.XHR_DEFAULTS;
        xhrOptions.url += '/private_conversations.json?per_page=' + perPage;
        if (page) {
          xhrOptions.url += '&page=' + page;
        }
        xhrOptions.token = auth.token;
        return xhrOptions;
      }).then(APIClient.callAPI);
    }
  };

  return APIClient;

});
