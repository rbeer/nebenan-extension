'use strict';

define(['apiclient', 'cookies', 'livereload'], (APIClient, Cookies, lreload) => {

  /**
   * Background Main App
   * @module bgApp
   */
  let app = {
    api: APIClient,
    cookies: Cookies,
    /**
     * Sanitized counter_stats.json from API
     * @property {number} messages      - \# of unread messages
     * @property {number} notifications - \# of unread notifications (i.e. feed activity)
     * @property {number} users         - \# of 'active' users
     * @property {number} all           - messages + notifications (for display on browserAction badge)
     * @type {Object}
     * @memberOf module:bgApp
     */
    counter_stats: { messages: 0, notifications: 0, users: 0, all: 0 }
  };

  /**
   * DEV/Debug mode injections
   */
  window.devlog = () => {};

  // @if DEV=true
  console.clear();
  console.debug('Welcome to debug mode!');
  window.bgApp = app;
  let devlog = window.devlog = console.debug;
  // @endif

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
   * Updates local stats counters
   * @memberOf module:bgApp
   * @return {Promise}
   */
  app.updateStats = () => {
    return new Promise((resolve, reject) => {
      Cookies.getToken().then(app.api.getCounterStats).then((stats) => {
        try {
          let jstats = JSON.parse(stats);
          app.sanitizeStats(jstats);
          app.counter_stats = jstats;
          resolve(jstats);
        } catch (err) {
          reject(err);
        }
      })
      .catch(reject);
    });
  };

  /**
   * Update browserAction icon and badge
   * @param {module:bgApp.counter_stats} stats
   * @memberOf module:bgApp
   */
  app.updateBrowserAction = (stats) => {
    devlog('Updating browserAction with:', stats);

    let allNew = stats.messages + stats.notifications;

    let iconPath = `images/icon-${allNew > 0 ? 'unread' : 'read'}_16.png`;
    chrome.browserAction.setIcon({ path: iconPath });

    chrome.browserAction.setBadgeText({ text: allNew.toString() });
  };

  chrome.runtime.onInstalled.addListener(details => {
    devlog('onInstalled:', details);

    // set browserAction badge color
    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });

    // periodical alarm for status updates
    chrome.alarms.create('nebenan', { when: Date.now(), periodInMinutes: 30 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      devlog('Alaram:', alarm);
      app.updateStats().then(app.updateBrowserAction).catch((err) => {
        devlog('onAlarm error:', err.code);
        devlog(err);
      });
    });

    // listen for runtime messages
    chrome.runtime.onMessage.addListener((msg, sender, respond) => {
      devlog('Received runtime message:', msg);

      // messages from browserAction popup
      if (msg.from === 'popupApp') {
        // request for online-user/messages/notifications counts
        if (msg.type === 'counter_stats') {

          app.updateStats()
          .then(app.updateBrowserAction)
          .then(() => {
            let res = {
              from: msg.to, to: msg.from,
              type: 'response', counter_stats: app.counter_stats
            };
            devlog('... responding with', res);
            respond(res);
          })
          .catch((err) => {
            switch(err.code) {
              case 'ENOTOKEN':
                // show login UI
                //chrome.runtime.sendMessage();
                devlog(err);
                break;
            }
          });
        }
      }
    });

  });

  return app;

});
