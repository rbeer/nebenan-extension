'use strict';

define([
  'alarms',
  'apiclient',
  'cookies',
  'livereload'], (Alarms, APIClient, Cookies, lreload) => {

  /**
   * Background Main App
   * @module bgApp
   */
  let app = {
    api: APIClient,
    alarms: null,
    /**
     * Holds answer data from API requests and their timeout values
     * @type {object}
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
       * @todo There is some error-indicating field in counter_stat.json if one is thrown; it will be inherited in module:bgApp.sanitizeStats and can be used (name tdb)
       *       New property discovered @ 17/03/28: 'house_group_user_ids' is an Array.<number>, holding id's of online people from ones own apartment house?
       * @type {Object}
       * @memberOf module:bgApp.requestCaches
       */
      stats: {
        data: { messages: 0, notifications: 0, users: 0, all: 0 },
        lastUpdate: 0
      },
      /**
       * Timeout length for cached API requests in minutes
       * @type {Number}
       * @memberOf module:bgApp.requestCaches
       */
      timeout: 5
    }
  };

  /**
   * DEV/Debug mode injections
   */
  window.devlog = () => void 0;

  // @if DEV=true
  console.clear();
  console.debug('Welcome to debug mode!');
  window.bgApp = app;
  let devlog = window.devlog = console.debug;
  // @endif

  // init Alarms
  app.alarms = new Alarms(app);

  /**
   * Initializes module:bgApp
   */
  app.init = () => {
    devlog('onStartup');
    // set browserAction badge color
    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });

    // activate counter_stats alarm
    app.alarms.startStats();

    // listen for runtime messages
    chrome.runtime.onMessage.addListener(app.handleMessages);
  };

  /**
   * Handles messages for bgApp receives
   * @param  {object}   msg     - Any JSON conform object
   * @param  {Sender}   sender  - Sender of the message
   * @param  {function} respond - Callback/Response channel
   * @return {bool}             - Returns true to set message channels into async state (i.e. not closing response channel by timeout)
   */
  app.handleMessages = (msg, sender, respond) => {
    devlog('Received runtime message:', msg);

    // bail out, if message is not for bgApp
    if (msg.to !== 'bgApp') {
      return;
    }

    // messages from browserAction popup
    // request for online-user/messages/notifications counts
    if (msg.from === 'popupApp' && msg.type === 'stats') {

      app.updateStats()
      .then(app.updateBrowserAction)
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
            app.alarms.stopStats();
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
   * NOTE: Mutates passed object.
   * @param  {object} stats - Parsed counter_stats.json
   * @memberOf module:bgApp
   */
  app.sanitizeStats = (stats) => {
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
   * Checks cache timeout for requested data. Resolves with cached data if API should be omitted.
   * @param  {string} cacheName - Must be member of module:bgApp.
   * @return {Promise}          - Resolves with cached data if still in request timeout
   */
  app.getCachedDataFor = (cacheName) => {
    let timeoutStamp = app.requestCaches[cacheName].lastUpdate +
                       app.requestCaches.timeout * 60000000;
    let data;
    devlog('now:', Date.now());
    devlog('timeout:', timeoutStamp);
    if (Date.now() < timeoutStamp) {
      devlog('Serving cached data for', cacheName);
      data = app.requestCaches[cacheName].data;
    }
    return data;
  };

  /**
   * Updates local stats counters
   * @memberOf module:bgApp
   * @return {Promise}
   */
  app.updateStats = () => {
    return new Promise((resolve, reject) => {

      // check for cached data and resolve if in reqeuest timeout
      let cached = app.getCachedDataFor('stats');
      if (cached) {
        // check whether user is logged in
        // before sending cached data
        Cookies.getToken()
        .then(() => {
          return resolve(cached);
        })
        .catch((err) => {
          devlog('Sending error albeit cached data available (logged out!)');
          return reject(err);
        });
        return;
      }

      // request data from API otherwise
      app.api.getCounterStats()
      .then((counter_stats) => {
        // always try, when JSON.parsing outside data sources;
        // it's an unforgiving bitch, at times ^_^
        try {
          // parse JSON string and sanitize stats
          let statsObj = JSON.parse(counter_stats);
          app.sanitizeStats(statsObj);
          // write to cache
          app.requestCaches.stats.data = statsObj;
          // update cache timeout
          app.requestCaches.stats.lastUpdate = Date.now();

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
   * @param {module:bgApp.requestCaches.stats} stats
   * @memberOf module:bgApp
   */
  app.updateBrowserAction = (stats) => {
    devlog('Updating browserAction with:', stats);

    let allNew = stats.messages + stats.notifications;

    let iconPath = `images/icon-${allNew > 0 ? 'unread' : 'read'}_16.png`;
    chrome.browserAction.setIcon({ path: iconPath });

    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });
    chrome.browserAction.setBadgeText({ text: allNew.toString() });

    return stats;
  };

  // fires when extension (i.e. user's profile) starts up
  chrome.runtime.onStartup.addListener(app.init);

  // fires when extension is installed or reloaded on extension page
  chrome.runtime.onInstalled.addListener(details => {
    devlog('onInstalled:', details);
// @if DEV=true
// init app on extension reloads when in dev mode
    app.init();
// @endif
  });

  return app;

});
