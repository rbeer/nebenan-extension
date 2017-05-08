define(['bg/apiclient/nsubset'], (NSubset) => {
  /**
   * @class  Status Data
   * @memberOf APIClient
   * @extends {APIClient.NSubset}
   */
  class NStatus extends NSubset {
    /**
     * Takes a notifcation_stats object form the API and creates a subset
     * with members of interest. Only those subset members are documented.
     * @param  {Object}  raw - response Object from notification_stats.json
     * @param  {Number}  raw.new_messages_count      - \# of new private conversation events
     * @param  {Number}  raw.new_notifications_count - \# of new general notifications
     * @return {NStats}
     */
    constructor(raw) {
      let compatibility_hack = function() {
        this.messages = raw.new_messages_count;
        this.notifications = raw.new_notifications_count;
      };
      super([ compatibility_hack ], raw);
      // TODO: use API's naming convention
      // let subsetKeys = [ 'new_messages_count', 'new_notifications_count' ];
      // super(subsetKeys, raw);

      this.allNew = this.messages + this.notifications;
      this.hasNew = this.allNew > 0;
      this.created_at_timestamp = Date.now();

    }

    get hasUpdates() {
      return this.messages > 0 || this.notifications > 0;
    }

    isDifferentFrom(lastStatus) {
      return this.messages !== lastStatus.messages ||
             this.notifications !== lastStatus.notifications;
    }

    /**
     * Takes an API response and returns an {@link APIClient.NStatus} instance
     * @param  {Object} raw - {@link APIClient.XHRRequest}.responseData
     * @see APIClient.wrapResponse
     * @see APIClient.XHRRequest
     * @return {Array.APIClient.NStatus}
     */
    static wrapRaw(raw) {
      return new NStatus(raw);
    }
  }

  return NStatus;
});
