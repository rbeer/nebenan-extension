'use strict';

define([ 'bg/cookies' ], (Cookies) => {
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
     * @param {Number} lower - UNIX epoch timestamp, ms precision; request only
     *                         notifications older than this value
     * @memberOf APIClient
     * @static
     * @see APIClient.callAPI
     * @return {Promise} - Resolves with response body from APIClient.callAPI
     */
    static getNotifications(lower) {
      let per_page = 7;
      return Cookies.getToken()
      .then((token) => {
        let xhrOptions = APIClient.XHR_DEFAULTS;
        xhrOptions.url += '/notifications.json?per_page=' + per_page;
        if (lower) {
          xhrOptions.url += '&lower=' + lower;
        }
        xhrOptions.token = token;
        return xhrOptions;
      })
      .then(APIClient.callAPI);
    }
  };

  class NSubset {
    constructor(keys, raw) {

      keys.forEach((key) => {
        if (typeof key === 'function') {
          key.bind(this)();
        } else {
          this[key] = raw[key];
        }
      });
    }
  };

  /**
   * @class Notification Data
   * @memberOf APIClient
   */
  class NItem extends NSubset {
    /**
     * Takes a raw notification object from the API and creates a subset with
     * only the members of interest to the extension.
     * @param {Object}   raw - Raw notification object as it comes from the API. The subset
     *                         will consist of:
     * @param {Number}   raw.id
     * @param {NMessage} raw.hood_message          - Message that triggered the notification
     * @param {Number}   raw.created_at_timestamp  - UNIX epoch timestamp, millisecond precision
     * @param {NType}    raw.notification_type_id  - Type of notification (market, feed, group, message)
     * @constructor
     * @return {NItem}
     */
    constructor(raw) {

      let extractMessage = function() {
        this.hood_message = new NMessage(raw.hood_message);
      };

      let subsetKeys = [
        'id', extractMessage, 'created_at_timestamp', 'notification_type_id'
      ];
      super(subsetKeys, raw);
    }
  };

  /**
   * @class Message, linked to an NItem
   * @memberOf APIClient
   */
  class NMessage extends NSubset {

    /**
     * Takes a raw hood_message object from the API and creates a subset with
     * only the members of interest to the extension.
     * @param  {Object}     raw                        - Raw hood_message object as it comes from the API. The subset will
     *                                                   consist of (a lot :smirk:):
     * @param {Number}   raw.id                        - Message's id
     * @param {Number}   raw.created                   - UNIX epoch timestamp, millisecond precision
     * @param {Number}   raw.user_id                   - Author's id
     * @param {Number}   raw.hood_message_type_id      - ! UNKNOWN !
     * @param {Number}   raw.hood_message_category_id  - ! UNKNOWN !
     * @param {?Number}  raw.hood_group_id             - Id of group, message was posted in
     * @param {String}   raw.body                      - Message body
     * @param {Number}   raw.hood_id                   - Id of author's hood
     * @param {String}   raw.subject                   - Message's title
     * @param {Bool}     raw.house_group               - Whether message's author lives in the same house
     * @param {Object[]} raw.images                    - Images, embedded in post
     * @param {Number}   raw.images.id                 - Image's id
     * @param {String}   raw.images.url                - Image's url
     * @param {String}   raw.images.url_medium         - Image's url (medium size/thumb)
     * @param {Object}   raw.user                      - Message's author
     * @param {Number}   raw.user.id                   - Author's id
     * @param {String}   raw.user.firstname            - Author's first name
     * @param {String}   raw.user.lastname             - Author's last name (might be shortened to (\w\.) )
     * @param {String}   raw.user.photo_thumb_url      - Auhtor's profile image (thumbnail size)
     * @param {Number}   raw.user.hood_id              - ID of author's hood
     * @param {String}   raw.user.hood_title           - Name of author's hood
     * @constructor
     * @return {NMessage}
     */
    constructor(raw) {

      let userSubsetKeys = [
        'id', 'firstname', 'lastname',
        'photo_thumb_url', 'hood_id', 'hood_title'
      ];

      let slimUser = function() {
        this.user = new NSubset(userSubsetKeys, raw);
      };

      let subsetKeys = [
        'id', 'created', 'user_id',
        'body', 'subject', 'images',
        'hood_message_type_id', 'hood_message_category_id', 'hood_group_id',
        'hood_id', 'house_group', slimUser
      ];
      super(subsetKeys, raw);
    }
  };

  /**
   * @class Notification Type
   * @memberOf APIClient
   * @throws {ReferenceError} If invoked. Class is static.
   */
  class NType {
    /**
     * @constructor
     */
    constructor() {
      throw new ReferenceError('Treat this class like a static enum!');
    }
    /**
     * **400** - Marketplace notification
     */
    static get MARKET() {
      return 400;
    }
    /**
     * **1200** - Feed notification
     */
    static get FEED() {
      return 1200;
    }
    /**
     * **300** - Event/Meeting notification
     */
    static get EVENT() {
      return 300;
    }
    /**
     * **320** - ????????
     */
    /*static get () {
      return 320;
    }*/
    /**
     * **401** - Answer/Comment notification
     */
    static get ANSWER() {
      return 401;
    }
  }

  return APIClient;

});
