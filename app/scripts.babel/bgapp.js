'use strict';

define(['apiclient'], (APIClient) => {

  /**
   * Background Main App
   * @module bgApp
   */
  let app = {
    api: APIClient
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

  chrome.runtime.onInstalled.addListener(details => {
    devlog('onInstalled:', details);
    chrome.alarms.create('nebenan', { when: Date.now(), periodInMinutes: 1 });

    chrome.alarms.onAlarm.addListener((alarm) => {
      devlog('Alaram:', alarm);
      app.getToken().then(app.api.getCounterStats).then((stats) => {
        let jstats = JSON.parse(stats);
        devlog(jstats);
      })
      .catch((err) => console.error(err));
    });

  });

  return app;

});
