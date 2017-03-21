'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('details', details);
});
chrome.cookies.get({ url: 'https://nebenan.de', name: 's' }, (cookie) => {
  if (cookie && cookie.name === 's') {
    console.debug('cookie:', cookie);
    console.debug('token (truncated):', cookie.value.substr(0, 14) + '...');
  } else {
    console.debug('No cookie found:', chrome.runtime.lastError);
  }
});

