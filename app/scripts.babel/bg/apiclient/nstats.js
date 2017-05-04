define(['bg/apiclient/nsubset'], (NSubset) => {
  /**
   * @class  Status Data
   * @memberOf APIClient
   * @extends {APIClient.NSubset}
   */
  class NStats extends NSubset {
    /**
     * Takes a notifcation_stats object form the API and creates a subset
     * with members of interest. Only those subset members are documented.
     * @param  {Object} raw - response Object from notification_stats.json
     * @param  {Number} raw.new_messages_count      - \# of new private conversation events
     * @param  {Number} raw.new_notifications_count - \# of new general notifications
     * @return {NStats}
     */
    constructor(raw) {
      let compatibility_hack = function() {
        this.messages = 'new_messages_count';
        this.notifications = 'new_notifications_count';
      };
      super([ compatibility_hack ], raw);
      // TODO: use API's naming convention
      // let subsetKeys = [ 'new_messages_count', 'new_notifications_count' ];
      // super(subsetKeys, raw);
    }
  }

  return NStats;
});
