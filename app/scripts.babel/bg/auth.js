'use strict';

define(() => {

  /**
   * @class Manages API authentication
   * - **NOTE**: The auth token cookie is shared by site and extension.
   *   Whatever the extension does with it, affects the site's behaviour, as well.
   */
  class Auth {

    constructor() {
      this.token = '';
    }

    static get tokenCookieIdentifier() {
      return {
        url: 'https://nebenan.de',
        name: 's'
      };
    }

    /**
     * Checks whether auth token value is available
     * @return {Promise} - Resolves `true` or rejects with `ENOTOKEN`
     */
    canAuthenticate() {
      devlog('Probing auth token value ...');
      let self = this;
      if (this.token.length > 0) {
        devlog('Token available:', this.token.substr(0, 10));
        return new Promise((resolve) => resolve(true));
      } else {
        devlog('No token value in memory. Asking chrome API ...');
        return Auth.getToken().then((token) => {
          self.token = token;
          devlog('Token available:', self.token.substr(0, 10));
          return true;
        });
      }
    }

    /**
     * Gets auth token from cookie
     * @memberOf Auth
     * @return {Promise} Resolves with auth token string or rejects
     */
    static getToken() {
      return new Promise((resolve, reject) => {
        chrome.cookies.get(Auth.tokenCookieIdentifier, (cookie) => {
          if (cookie && cookie.name === 's') {
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
     * - **NOTE:** This also affects visiting the website directly.
     * @memberOf Auth
     * @return {Promise}
     */
    static removeToken() {
      return new Promise((resolve) => {
        chrome.cookies.remove(Auth.tokenCookieIdentifier, resolve);
      });
    }
  }

  return new Auth();

});
