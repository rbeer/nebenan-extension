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
    console.log('details', details);
    chrome.alarms.create('nebenan', { when: Date.now(), periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      devlog(alarm);
    });
    chrome.runtime.onSuspend(() => devlog('suspending'));
  });

  return app;

});
