'use strict';

define([
  'bg/alarms',
  'bg/apiclient',
  'bg/cookies',
  'bg/livereload'
], (Alarms, APIClient, Cookies, lreload) => {

  /**
   * Background Main App
   * @module bg/app
   */
  let bgApp = {
    api: APIClient,
    alarms: null,
    /**
     * Holds answer data from API requests and their timeout values
     * @type {object}
     * @memberOf module:bg/app
     */
    requestCaches: {
      /**
       * Sanitized counter_stats.json from API
       * @property {object} data               - Response data
       * @property {number} data.messages      - \# of unread messages
       * @property {number} data.notifications - \# of unread notifications (i.e. feed activity)
       * @property {number} data.users         - \# of 'active' users
       * @property {number} data.all           - messages + notifications (for display on browserAction badge)
       * @property {number} lastUpdate         - epoch timestamp of last API request
       * @todo There is some error-indicating field in counter_stat.json if one is thrown; it will be inherited in module:bg/app.sanitizeStats and can be used (name tdb)
       *       New property discovered @ 17/03/28: 'house_group_user_ids' is an Array.<number>, holding id's of online people from ones own apartment house?
       * @type {Object}
       * @memberOf module:bg/app.requestCaches
       */
      stats: {
        data: { messages: 0, notifications: 0, users: 0, all: 0 },
        lastUpdate: 0
      },
      /**
       * Timeout length for cached API requests in minutes
       * @type {Number}
       * @memberOf module:bg/app.requestCaches
       */
      timeout: 5
    }
  };

  /**
   * DEV/Debug mode augmentations
   * Use `$ gulp dev` to activate
   */

  // noop when not in dev mode
  window.devlog = () => void 0;

  // @if DEV=true
  // included in .rjs-dev
  require(['bg/dev'], (dev) => {
    bgApp.dev = dev;
    bgApp.dev.init(bgApp);
  });
  // @endif

  /**
   * Initializes module:bg/app
   * - Starts Alarm for stats
   * - Listens to runtime messages
   * @memberOf module:bg/app
   */
  bgApp.init = () => {
    devlog('onStartup');
    // set browserAction badge color
    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });

    // init Alarms
    bgApp.alarms = new Alarms(bgApp);

    // activate counter_stats alarm
    bgApp.alarms.startStats();

    // listen for runtime messages
    chrome.runtime.onMessage.addListener(bgApp.handleMessages);
  };

  /**
   * Handles messages for module:bg/app
   * @param  {object}   msg     - Any JSON conform object
   * @param  {Sender}   sender  - Sender of the message
   * @param  {function} respond - Callback/Response channel
   * @memberOf module:bg/app
   * @return {bool}             - Returns true to set message channels into async state (i.e. not closing response channel prematurely)
   */
  bgApp.handleMessages = (msg, sender, respond) => {
    devlog('Received runtime message:', msg);

    // bail out, if message is not for bgApp
    if (msg.to !== 'bgApp') {
      return;
    }

    // messages from browserAction popup
    // request for online-user/messages/notifications counts
    if (msg.from === 'popupApp' && msg.type === 'stats') {

      bgApp.updateStats()
      .then(bgApp.updateBrowserAction)
      .then((stats) => {
        let res = {
          from: msg.to, to: msg.from,
          type: 'response', stats: stats
        };
        devlog('... responding with', res);
        respond(res);
      })
      .catch((err) => {
        devlog(err);
        switch(err.code) {
          // No auth token/cookie
          case 'ENOTOKEN':
            devlog(err.message);
            // tell popup to show login UI
            let res = {
              from: msg.to, to: msg.from,
              type: 'error', solution: 'showLoginUI'
            };
            devlog('... responding with', res);
            respond(res);
            // stop counter_stats API requests
            bgApp.alarms.stopStats();
            break;
        }
      });
    }

    // return true from handler to keep respond() channel open
    // (as in, 'respect muh asynciteeh!')
    return true;
  };

  /**
   * Sanitizes API's counter_stats.json for internal use.
   * - **NOTE**: Mutates passed object.
   * @param  {object} stats - Parsed counter_stats.json
   * @memberOf module:bg/app
   */
  bgApp.sanitizeStats = (stats) => {
    let nameMap = [
      [ 'users', 'hood_active_users_count' ],
      [ 'messages', 'new_messages_count' ],
      [ 'notifications', 'new_notifications_count' ]
    ];
    nameMap.forEach((namePair) => {
      stats[namePair[0]] = parseInt(stats[namePair[1]], 10);
      delete stats[namePair[1]];
    });
  };

  /**
   * Checks cache timeout for requested data.
   * - Resolves with cached data if API should be omitted.
   * @param  {string} cacheName - Must be member of module:bg/app.
   * @return {Promise}          - Resolves with cached data if still in request timeout
   */
  bgApp.getCachedDataFor = (cacheName) => {
    let timeoutStamp = bgApp.requestCaches[cacheName].lastUpdate +
                       bgApp.requestCaches.timeout * 60000000;
    let data;
    devlog('now:', Date.now());
    devlog('timeout:', timeoutStamp);
    if (Date.now() < timeoutStamp) {
      devlog('Serving cached data for', cacheName);
      data = bgApp.requestCaches[cacheName].data;
    }
    return data;
  };

  /**
   * Updates local stats counters
   * - 1 Tries to get cached data
   * - 1.1 If cache is available: checks for auth token
   * - 1.1.1 If auth token is available: resolves with cached data
   * - 1.1.2 If auth token is not available: rejects with received "ENOTOKEN"
   * - 1.2 If no cache is available: requests stats from API
   * - 1.2.1 JSON-parses and sanitizes API response (counter_stats.json)
   * - 1.2.2 Updates cache and cache timeout
   * - 1.2.3 Resolves with parsed/sanitized data
   * - 1.3 Rejects on all other errors
   * @memberOf module:bg/app
   * @return {Promise}
   */
  bgApp.updateStats = () => {
    return new Promise((resolve, reject) => {

      if (bgApp.dev.forceLoggedOut) {
        let err = new Error('Simulated ENOTOKEN!');
        err.code = 'ENOTOKEN';
        return reject(err);
      }

      // check for cached data and resolve if in reqeuest timeout
      let cached = bgApp.getCachedDataFor('stats');
      if (cached) {
        // check whether user is logged in
        // before sending cached data
        Cookies.getToken()
        .then(resolve.bind(null, cached))
        .catch((err) => {
          devlog('Sending error albeit cached data available (logged out!)');
          return reject(err);
        });
        return;
      }

      // request data from API otherwise
      bgApp.api.getCounterStats()
      .then((counter_stats) => {
        // always try, when JSON.parsing outside data sources;
        // it's an unforgiving bitch, at times ^_^
        try {
          // parse JSON string and sanitize stats
          let statsObj = JSON.parse(counter_stats);
          bgApp.sanitizeStats(statsObj);
          // write to cache
          bgApp.requestCaches.stats.data = statsObj;
          // update cache timeout
          bgApp.requestCaches.stats.lastUpdate = Date.now();

          resolve(statsObj);
        } catch (err) {
          reject(err);
        }
      })
      .catch(reject);
    });
  };

  /**
   * Update browserAction icon and badge
   * @param {module:bg/app.requestCaches.stats} stats
   * @memberOf module:bg/app
   */
  bgApp.updateBrowserAction = (stats) => {
    devlog('Updating browserAction with:', stats);

    let allNew = stats.messages + stats.notifications;

    let iconPath = `images/icon-${allNew > 0 ? 'unread' : 'read'}_16.png`;
    chrome.browserAction.setIcon({ path: iconPath });

    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });
    chrome.browserAction.setBadgeText({ text: allNew + '' });

    return stats;
  };

  // fires when extension (i.e. user's profile) starts up
  chrome.runtime.onStartup.addListener(bgApp.init);

  // fires when extension is installed or reloaded on extension page
  chrome.runtime.onInstalled.addListener(details => {
    devlog('onInstalled:', details);
// @if DEV=true
// init bgApp on extension reloads when in dev mode
    bgApp.init();
// @endif
  });

  return bgApp;

});
