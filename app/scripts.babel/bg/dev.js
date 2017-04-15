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
    window.devlog = dev.log;
  };

  /**
   * Log function for development mode
   * - Prepends log output with [@function] tag
   * @param  {...Object} parts - Any object you would also pass to console.debug
   * @memberOf module:bg/dev
   */
  dev.log = (...parts) => {
    parts.unshift(`[${dev.buildFunctionTag()}]`);
    console.debug.apply(null, parts);
  };

  /**
   * Builds `@function.doing.the_logging` tag for log outputs
   * - Tag is derived from an error stack
   * @memberOf module:bg/dev
   * @return {string} Either the found `@function` tag or `not/found`
   */
  dev.buildFunctionTag = () => {
    let fnRX = /at dev\.log .*\n\s*at (.+) \(/;
    Error.stackTraceLimit = 25;
    let stack = new Error().stack;
    let fnMatch = stack.match(fnRX);
    return fnMatch ? `@${fnMatch[1]}` : 'not/found';
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
   * @param {Number} lower - UNIX epoch timestamp, ms precision; request only
   *                         notifications older than this value
   * @memberOf module:bg/dev
   */
  dev.getNotifications = (lower) => {
    dev.bgApp.api.getNotifications(lower)
    .then((nitems) => {
      devlog('nitems:', nitems);
    })
    .catch((err) => {
      devlog('caught error:', err.message);
      console.error(err);
    });
  };

  return dev;

});
