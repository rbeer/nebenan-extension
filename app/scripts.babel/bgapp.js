'use strict';

define(['apiclient'], (APIClient) => {

  let app = {
    api: APIClient
  };

  app.getToken = () => {
    chrome.cookies.get({ url: 'https://nebenan.de', name: 's' }, (cookie) => {
      if (cookie && cookie.name === 's') {
        console.debug('token cookie:', cookie);
        return cookie.value;
      } else {
        console.debug('No cookie found:', chrome.runtime.lastError);
        return '';
      }
    });
  };

  chrome.runtime.onInstalled.addListener(details => {
    console.log('details', details);
  });

  return app;

});
