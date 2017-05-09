// @ifdef DEV
/* global bgApp */
// @endif
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
      this.SIM_ENOTOKEN = false;
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
      // @ifdef DEV
      if (bgApp.dev.forceLoggedOut) {
        let err = new Error('Simulated ENOTOKEN!');
        err.code = 'ENOTOKEN';
        console.error(err);
        return new Promise((resolve, reject) => reject(err));
      }
      // @endif
      if (this.token.length > 0) {
        return new Promise((resolve) => resolve(this.token));
      } else {
        return Auth.getToken().then((token) => {
          self.token = token;
          devlog('Token available:', self.token.substr(0, 10));
          return token;
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
  }

  return new Auth();

});
