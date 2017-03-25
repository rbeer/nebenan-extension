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
       * Reference to parent (i.e. this module requiring) App
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
      this.statsPeriod = 30;

      chrome.alarms.onAlarm.addListener(Alarms.handleAlarms.bind(this));
    }

    /**
     * Organizes firing alarms
     * @memberOf Alarms
     * @static
     * @param {Alarm} alarm - Fired alarm
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
