'use strict';

define(() => {

  /**
   * @class Handles periodical API requests
   */
  class Alarms {

    /**
     * @constructor
     * @param  {module:bgApp} parentApp
     * @memberOf Alarms
     * @return {Alarms}
     */
    constructor(parentApp) {

      /**
       * Reference to parent (i.e. this module requiring) app
       * @type {module:bgApp}
       */
      this.parentApp = parentApp;
      /**
       * Alarm name for counter_stats requests
       * @type {String}
       */
      this.statsName = 'nebenan_stats';

      /**
       * Timeout period for counter_stats requests in minutes
       * @type {Number}
       */
      this.statsPeriod = 1;

      chrome.alarms.onAlarm.addListener(Alarms.handleAlarms.bind(this));
    }

    /**
     * Receives fired alarms and refers them to their handlers
     * @memberOf Alarms
     * @static
     * @param {chrome.alarms.Alarm} alarm - Fired alarm
     * @see [chrome.alarms.Alarm]{@link https://developer.chrome.com/extensions/alarms#type-Alarm}
     * @this Alarms
     */
    static handleAlarms(alarm) {
      devlog('Alarm:', alarm);

      if (alarm.name === this.statsName) {
        this.fireStats();
      } else {
        devlog('UNKNOWN ALARM:', alarm);
      }
    }

    /**
     * Schedules periodical alarm for counter_stats
     * @memberOf Alarms
     */
    startStats() {
      devlog('Starting', this.statsName);
      chrome.alarms.create(this.statsName, {
        when: Date.now(),
        periodInMinutes: this.statsPeriod
      });
    }

    /**
     * Handler for counter_stats alarm
     * @memberOf Alarms
     */
    fireStats() {
      devlog(this.statsName, 'is firing.');
      let self = this;
      this.parentApp.updateStats()
      .then(this.parentApp.updateBrowserAction)
      .catch((err) => {
        if (err.code === 'ENOTOKEN') {
          devlog(err.message);
          // stop requesting stats when there is no auth token
          self.stopStats();
          // set browserAction badge into error state
          // TODO: refactor into module:ui or so? (net yet implemented!)
          chrome.browserAction.setBadgeBackgroundColor({ color: [ 255, 0, 0, 255 ] });
          chrome.browserAction.setBadgeText({ text: '!' });
        }
      });
    }

    /**
     * Stops counter_stats requests
     * @memberOf Alarms
     */
    stopStats() {
      devlog('Stopping', this.statsName);
      chrome.alarms.clear(this.statsName);
    }

  }

  return Alarms;

});
