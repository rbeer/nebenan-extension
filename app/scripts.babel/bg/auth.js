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
     * [canAuthenticate description]
     * @return {[type]} [description]
     */
    static canAuthenticate() {
      let self = this;
      if (this.token.length > 0) {
        return new Promise((resolve) => resolve(true));
      } else {
        return Auth.getToken().then((token) => {
          self.token = token;
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

  return Auth;

});
