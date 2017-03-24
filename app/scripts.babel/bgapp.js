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
          devlog('token cookie:', cookie);
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
    nameMap.forEach((names) => {
      stats[names[0]] = stats[names[1]];
      delete stats[names[1]];
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
    console.log('Updating browser action with:', stats);

    let newMessages = stats.new_messages_count;
    let newNotifications = stats.new_notifications_count;
    let allNew = newMessages + newNotifications;

    let iconPath = `images/icon-${allNew > 0 ? 'unread' : 'read'}_16.png`;
    chrome.browserAction.setIcon({ path: iconPath });

    chrome.browserAction.setBadgeText({ text: allNew.toString() });
  };

  chrome.runtime.onInstalled.addListener(details => {
    devlog('onInstalled:', details);

    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });

    chrome.alarms.create('nebenan', { when: Date.now(), periodInMinutes: 30 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      devlog('Alaram:', alarm);
      app.updateStats().then(app.updateBrowserAction);
    });

  });

  return app;

});
