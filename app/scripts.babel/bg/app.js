'use strict';

define([
  'bg/alarms',
  'bg/apiclient',
  'bg/auth',
  'bg/livereload',
  'bg/request-cache'
], (Alarms, APIClient, auth, lreload, RequestCache) => {

  /**
   * Background Main App
   * @module bg/app
   */
  let bgApp = {
    api: APIClient,
    alarms: null,
    auth: auth,
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
      stats: new RequestCache.StatsCache({
        messages: 0, notifications: 0,
        users: 0, all: 0
      }, 0)
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
   * Checks cache timeout for requested data.
   * - Resolves with cached data if API should be omitted.
   * @param  {string} cacheName - Must be member of module:bg/app.
   * @return {Promise}          - Resolves with cached data if still in request timeout
   */
  bgApp.getCachedDataFor = (cacheName) => {
    if (bgApp.requestCaches[cacheName].hasExpired) {
      devlog(`Cache for ${cacheName} has expired.`);
      return void 0;
    } else {
      devlog(`Serving cached data for ${cacheName}`);
      return bgApp.requestCaches[cacheName].data;
    }
  };

  /**
   * Updates local stats
   * - check whether extension has auth token value (user is logged in)
   * - check cache
   * @memberOf module:bg/app
   * @return {Promise}
   */
  bgApp.updateStats = () => {
      // @if DEV=true
      /*if (bgApp.dev.forceLoggedOut) {
        let err = new Error('Simulated ENOTOKEN!');
        err.code = 'ENOTOKEN';
        return reject(err);
      }*/
      // @endif

    return bgApp.auth.canAuthenticate()                         // 1. make sure user is logged in
          .then(bgApp.getCachedDataFor.bind(null, 'stats'))     // 2. try cached data
          .then(bgApp.api.getCounterStats)                      //    request data from API, otherwise
          .then((counter_stats) => {
            // not a string? cached data!
            if (typeof counter_stats !== 'string') {
              return counter_stats;
            } else {
              // parse JSON string and update cache
              let statsObj = JSON.parse(counter_stats);
              bgApp.requestCaches.stats.data = statsObj;
              return statsObj;
            }
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
