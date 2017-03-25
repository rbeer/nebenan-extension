'use strict';

define(['apiclient', 'livereload'], (APIClient, lreload) => {

  /**
   * Background Main App
   * @module bgApp
   */
  let app = {
    api: APIClient,
    counter_stats: {}
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
   * Gets auth token from cookie
   * @memberOf module:bgApp
   * @return {Promise} Resolves with auth token string or rejects
   */
  app.getToken = () => {
    return new Promise((resolve, reject) => {
      chrome.cookies.get({ url: 'https://nebenan.de', name: 's' }, (cookie) => {
        if (cookie && cookie.name === 's') {
          devlog('Token cookie:', cookie);
          resolve(cookie.value);
        } else {
          devlog('No auth cookie found:', chrome.runtime.lastError);
          reject('ENOTOKEN');
        }
      });
    });
  };

  /**
   * Sanitizes API's counter_stats.json for internal use.
   * NOTE: Mutates passed object.
   * @param  {object} stats - Parsed counter_stats.json
   * @memberOf bgApp
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
   * @return {Promise}
   */
  app.updateStats = () => {
    return new Promise((resolve, reject) => {
      app.getToken().then(app.api.getCounterStats).then((stats) => {
        try {
          let jstats = JSON.parse(stats);
          app.sanitizeStats(jstats);
          app.counter_stats = jstats;
          resolve(jstats);
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  /**
   * Update browserAction icon and badge
   * @param  {object} stats counter_stats.json, received from API
   * @param  {number} stats.hood_active_users_count
   * @param  {number} stats.new_messages_count
   * @param  {number} stats.new_notifications_count
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
      app.updateStats().then(app.updateBrowserAction);
    });

    // listen for runtime messages
    chrome.runtime.onMessage.addListener((msg, sender, respond) => {
      devlog('Received runtime message:', msg);

      // messages from browserAction popup
      if (msg.from === 'popupApp') {
        // request for online-user/messages/notifications counts
        if (msg.type === 'counter_stats') {

          let res = {
            from: msg.to, to: msg.from,
            type: 'response', counter_stats: app.counter_stats
          };
          devlog('... responding with', res);
          respond(res);

        }
      }
    });

  });

  return app;

});
