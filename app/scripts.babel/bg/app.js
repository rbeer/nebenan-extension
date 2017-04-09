'use strict';

define([
  'bg/alarms',
  'bg/apiclient',
  'bg/auth',
  'bg/livereload',
  'bg/request-cache',
  'messaging'
], (Alarms, APIClient, auth, lreload, RequestCache, Messaging) => {

  /**
   * Background Main App
   * @module bg/app
   */
  let bgApp = {
    api: APIClient,
    alarms: null, // -> .init()
    auth: auth,
    messaging: null, // -> .init()
    /**
     * Holds answer data from API requests and their timeout values
     * @type {object}
     * @memberOf module:bg/app
     */
    requestCaches: {
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

    // init Messaging
    bgApp.messaging = new Messaging({
      getStats: (msg, respond) => {
        bgApp.getStats()
        .then((stats) => {
          let response = msg.cloneForAnswer(['setStats'], stats);
          respond(response);
        });
      }
    }, 'bg/app');
    // start listening for messages
    bgApp.messaging.listen();

    // init Alarms
    bgApp.alarms = new Alarms(bgApp);
    // activate counter_stats alarm
    bgApp.alarms.startStats();

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
   * @memberOf module:bg/app
   * @return {Promise}
   */
  bgApp.getStats = () => {
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
    // init bgApp on extension reloads
    bgApp.init();
  });

  return bgApp;

});
