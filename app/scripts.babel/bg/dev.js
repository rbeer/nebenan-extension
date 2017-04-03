'use strict';

define(() => {
  console.clear();
  console.debug('Welcome to debug mode!');

  /**
   * Development mode augmentations
   * @module bg/dev
   */
  let dev = {};

  dev.init = (bgApp) => {
    /**
     * Parent app (bgApp)
     * @type {module:bg/app}
     * @memberOf module:bg/dev
     */
    dev.bgApp = window.bgApp = bgApp;
    /**
     * Simulate logged out state
     * @type {Bool}
     * @memberOf module:bg/dev
     */
    dev.forceLoggedOut = false;

    // activate dev log
    window.devlog = console.debug;
  };

  /**
   * Toggle simulated logged-out state
   * @param  {?Bool} state - **false**: logged out, **true**: honor cookie/token, **!**: toggle
   * @memberOf module:bg/dev
   * @return {String}      - Confirmation of taken action
   */
  dev.toggleLoggedIn = (state) => {
    let forced = dev.forceLoggedOut;
    dev.forceLoggedOut = typeof state === 'boolean' ? state : !forced;
    return dev.forceLoggedOut ? 'Simulating logged out state!' :
                                      'Login state according to auth token.';
  };

  /**
   * Test/Discover notifications.json from API
   * @memberOf module:bg/dev
   */
  dev.getNotifications = () => {
    dev.bgApp.api.getNotifications()
    .then((body) => {
      let notifications = JSON.parse(body).notifications;
      devlog('notifications:', notifications);
    })
    .catch((err) => console.error('JSON parsing error,', err));
  };

});
