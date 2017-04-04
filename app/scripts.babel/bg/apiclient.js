'use strict';

define([ 'bg/cookies' ], (Cookies) => {
  /**
   * @class Client to nebenan.de API
   */
  class APIClient {

    constructor() {
      this.options = APIClient.XHR_DEFAULTS;
    }

    static get NItem() {
      return NItem;
    }
/*
    static get NMessage() {
      return NMessage;
    }

    static get NType() {
      return NType;
    }
*/
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
      if (cached) {
        return cached;
      }
      return Cookies.getToken()
      .then((token) => {
        let xhrOptions = APIClient.XHR_DEFAULTS;
        xhrOptions.url += '/profile/counter_stats.json';
        xhrOptions.token = token;
        return xhrOptions;
      })
      .then(APIClient.callAPI);
    }

    /**
     * Requests notifications.json
     * @see APIClient.callAPI
     * @memberOf APIClient
     * @static
     * @return {Promise} - Resolves with response body from APIClient.callAPI
     */
    static getNotifications() {
      return Cookies.getToken()
      .then((token) => {
        let xhrOptions = APIClient.XHR_DEFAULTS;
        xhrOptions.url += '/notifications.json?per_page=20';
        xhrOptions.token = token;
        return xhrOptions;
      })
      .then(APIClient.callAPI);
    }
  };

  /**
   * @class Notification
   */
  class NItem {
    /**
     * Takes a raw notification object from the API and creates a subset with
     * only the members of interest to the extension.
     * @param {Object}   raw - Raw notification object as it comes from the API. The subset
     *                         will consist of:
     * @param {Number}   raw.id
     * @param {NMessage} raw.hood_message          - Message that triggered the notification
     * @param {Number}   raw.created_at_timestamp  - UNIX epoch timestamp, millisecond precision
     * @param {NType}    raw.notification_type_id  - Type of notification (market, feed, group, message)
     * @memberOf APIClient
     * @return {NItem}
     */
    constructor(raw) {

      let subsetKeys = [
        'id', 'hood_message', 'created_at_timestamp', 'notification_type_id'
      ];
      subsetKeys.forEach((key) => {
        this[key] = raw[key];
      });

    }
  };

  /**
   * Message, linked to an NItem
   * @typedef {Object} NMessage
   * @property {Number}   id                        - Message's id
   * @property {Number}   created                   - UNIX epoch timestamp, millisecond precision
   * @property {Number}   user_id                   - Author's id
   * @property {Number}   hood_message_type_id      - ! UNKNOWN !
   * @property {Number}   hood_message_category_id  - ! UNKNOWN !
   * @property {?Number}  hood_group_id             - Id of group, message was posted in
   * @property {String}   body                      - Message body
   * @property {Number}   hood_id                   - Id of author's hood
   * @property {String}   subject                   - Message's title
   * @property {Bool}     house_group               - Whether message's author lives in the same house
   * @property {Object[]} images                    - Images, embedded in post
   * @property {Number}   images.id                 - Image's id
   * @property {String}   images.url                - Image's url
   * @property {String}   images.url_medium         - Image's url (medium size/thumb)
   * @property {Object}   user                      - Message's author
   * @property {Number}   user.id                   - Author's id
   * @property {String}   user.firstname            - Author's first name
   * @property {String}   user.lastname             - Author's last name (might be shortened to (\w\.) )
   * @property {String}   user.photo_thumb_url      - Auhtor's profile image (thumbnail size)
   * @property {Number}   user.hood_id              - ID of author's hood
   * @property {String}   user.hood_title           - Name of author's hood
   * @memberOf APIClient
   */

  /**
   * Notification Type, number values from API
   * @typedef {Object} NType
   * @property {Number} 400  - Marketplace notification
   * @property {Number} 1200 - Feed notification
   * @memberOf APIClient
   */

  return APIClient;

});
