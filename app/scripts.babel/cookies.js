'use strict';

define(() => {

  /**
   * @class Manages cookie with auth token
   * **NOTE: The auth token cookie is shared by site and extension.
   * Whatever the extension does with it, affects the site's behaviour.**
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
          devlog('Token cookie:', cookie);
          if (cookie && cookie.name === 's') {
            devlog('Auth token:', cookie.value.substr(0, 14) + '...');
            resolve(cookie.value);
          } else {
            let err = new Error('No auth token cookie found.');
            err.code = 'ENOTOKEN';
            reject(err);
          }
        });
      });
    }

    /**
     * Deletes cookie with auth token (a/k/a logout)
     * **NOTE:** This also affects visiting the website directly.
     * @memberOf Cookies
     * @return {Promise}
     */
    static removeToken() {
      return new Promise((resolve) => {
        chrome.cookies.remove(Cookies.tokenCookieIdentifier, resolve);
      });
    }
  }

  return Cookies;

});
