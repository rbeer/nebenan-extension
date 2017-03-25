'use strict';

define(() => {

  /**
   * @class Manages cookie with auth token
   */
  class Cookies {

    static get tokenCookieIdentifier() {
      return {
        url: 'https://nebenan.de',
        name: 's'
      };
    }

    /**
     * **Gets auth token from cookie**
     * @memberOf Cookies
     * @return {Promise} Resolves with auth token string or rejects
     */
    static getToken() {
      return new Promise((resolve, reject) => {
        chrome.cookies.get(Cookies.tokenCookieIdentifier, (cookie) => {
          if (cookie && cookie.name === 's') {
            devlog('Token cookie:', cookie);
            resolve(cookie.value);
          } else {
            devlog('No auth cookie found:', chrome.runtime.lastError);
            reject('ENOTOKEN');
          }
        });
      });
    }
  }

  return Cookies;

});
