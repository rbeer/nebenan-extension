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

      chrome.alarms.onAlarm.addListener(this.handleStatsAlarm.bind(this));
    }

    /**
     * Schedules periodical alarm for counter_stats
     * @memberOf Alarms
     */
    startStatsAlarm() {
      chrome.alarms.create(this.statsName, { when: Date.now(), periodInMinutes: this.statsPeriod });
    }

    /**
     * Handler for counter_stats alarm
     * @param  {Alarm} alarm - Fired alarm
     */
    handleStatsAlarm(alarm) {
      devlog('Alaram:', alarm);
      this.parentApp.updateStats()
      .then(this.parentApp.updateBrowserAction)
      .catch((err) => {
        devlog('onAlarm error:', err.code);
        devlog(err);
      });
    }

  }

  return Alarms;

});
