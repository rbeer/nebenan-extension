'use strict';

define([
  'bg/auth',
  'bg/cache',
  'bg/storage',
  'bg/apiclient/nstatus',
  'bg/apiclient/notifications/nitem',
  'bg/apiclient/notifications/nmessage',
  'bg/apiclient/notifications/ntype',
  'bg/apiclient/messages/pcitem',
  'bg/apiclient/messages/pcmessage'
], (auth, cache, storage, NStatus, NItem, NMessage, NType, PCItem, PCMessage) => {
  /**
   * @class Client to nebenan.de API
   */
  class APIClient {

    constructor() {
      this.options = APIClient.XHR_DEFAULTS;
    }

    // sub classes
    static get NStatus() {
      return NStatus;
    }
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
     * @typedef XHRRequest
     * @memberOf APIClient
     * @static
     * @property {string} method - Request method, e.g. `'GET', 'POST'`
     * @property {string} url    - API endpoint URL to call
     * @property {string} token  - Auth token to send with request
     * @property {APIClient.NStatus|APIClient.NItem|APIClient.PCItem} WrapperClass - Class to wrap response in
     * @property {Object} responseData - JSON parsed response body
     */

    /**
     * Default XHRRequest
     */
    static get XHR_DEFAULTS() {
      return {
        method: 'GET',
        url: 'https://api.nebenan.de/api/v2',
        token: '',
        WrapperClass: void 0,
        responseData: void 0
      };
    }

    /**
     * Executes XMLHttpRequest
     * @memberOf APIClient
     * @static
     * @param  {!APIClient.XHRRequest} request - Options passed to XMLHttpRequest
     * @throws {TypeError} if (!request)
     * @return {Promise}                       - Resolves with response body
     */
    static callAPI(request) {

      if (!request) {
        throw new TypeError('First argument must be an XHRRequest object.');
      }

      return new Promise((resolve, reject) => {

        // request object
        let xhr = new XMLHttpRequest();

        // response handler
        xhr.onreadystatechange = function() {
          if (this.readyState === 4) {
            request.responseData = JSON.parse(this.response);
            resolve(request);
          }
        };

        // error handler
        xhr.onerror = (err) => {
          xhr.abort();
          reject(err);
        };

        // open connection
        xhr.open(request.method, request.url);

        // set request headers
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-AUTH-TOKEN', request.token);

        // send
        xhr.send();
      });
    }

    /**
     * Wraps API call response in Array of NSubsets, as defined by req.WrapperClass
     * and implemented by req.WrapperClass.wrapRaw(Object: raw). Also stores
     * created NSubsets in cache.
     * @param  {APIClient.XHRRequest} req
     * @return {Promise.<Array.<APIClient.NSubset>|APIClient.NSubset, Error>}
     */
    static wrapResponse(req) {
      let wrapped = req.WrapperClass.wrapRaw(req.responseData);
      return cache.cacheSubsets(wrapped);
    }

    static issueRequest(req) {
      return auth.canAuthenticate()
      .then((token) => {
        req.token = token;
        return APIClient.callAPI(req);
      })
      .then(APIClient.wrapResponse);
    }

    static createRequest(path, WrapperClass) {
      let xhrRequest = APIClient.XHR_DEFAULTS;
      xhrRequest.url += path;
      xhrRequest.WrapperClass = WrapperClass;
      xhrRequest.token = auth.token;
      return xhrRequest;
    }

    /**
     * Requests counter_stats.json
     * @see APIClient.callAPI
     * @memberOf APIClient
     * @static
     * @return {Promise} - Resolves with an Array of a single NStatus instance
     */
    static getStatus() {
      let req = APIClient.createRequest('/profile/counter_stats.json', NStatus);
      return APIClient.issueRequest(req);
    }

    /**
     * Requests notifications.json
     * @param {?Number} perPage=7 - \# of notifications to request
     * @param {?Number} lower     - UNIX epoch timestamp, ms precision; request only
     *                              notifications older than this value
     * @memberOf APIClient
     * @static
     * @see APIClient.callAPI
     * @return {Promise} - Resolves with the response body APIClient.callAPI resolved with
     */
    static getNotifications(perPage, lower) {
      perPage = perPage || 7;
      let path = '/notifications.json?per_page=' + perPage;
      if (lower) {
        path += '&lower=' + lower;
      }
      let req = APIClient.createRequest(path, NItem);
      return APIClient.issueRequest(req);
    }

    static getConversations(perPage, page) {
      perPage = perPage || 7;
      let path = '/private_conversations.json?per_page=' + perPage;
      if (page) {
        path += '&page=' + page;
      }
      let req = APIClient.createRequest(path, PCItem);
      return APIClient.issueRequest(req);
    }
  };

  return APIClient;

});
