'use strict';

define([
  'bg/apiclient/nsubset',
  'bg/apiclient/notifications/nmessage',
  'bg/apiclient/notifications/ntype'
], (NSubset, NMessage, NType) => {
  /**
   * @class Notification Data
   * @memberOf APIClient
   * @extends {APIClient.NSubset}
   */
  class NItem extends NSubset {
    /**
     * Takes a raw notification object from the API and creates a subset with
     * members of interest to the extension. Only those subset members are documented.
     * @param {Object}   raw
     * @param {Number}   raw.id
     * @param {Object}   raw.hood_message          - Message that triggered the notification
     * @param {Number}   raw.created_at_timestamp  - UNIX epoch timestamp, millisecond precision
     * @param {NType}    raw.notification_type_id  - Type of notification (market, feed, group, message)
     * @param {Bool}     raw.seen                  - Whether notification has been clicked / content visited
     * @param {?Object}  raw.parent_hood_message   - Parent Message if NType.ANSWER
     * @constructor
     * @return {NItem}
     */
    constructor(raw) {

      let customSetters = function customSetters() {
        this.notification_type_id = new NType(raw.notification_type_id);
        this.hood_message = new NMessage(raw.hood_message, raw.parent_hood_message);
      };

      let subsetKeys = [
        'id', 'created_at_timestamp', 'seen', customSetters
      ];
      super(subsetKeys, raw);
    }

    /**
     * Takes an API response and returns an Array of {@link APIClient.NItem}
     * @param  {Object} raw - {@link APIClient.XHRRequest}.responseData
     * @see APIClient.wrapResponse
     * @see APIClient.XHRRequest
     * @return {Array.<APIClient.NItem>}
     */
    static wrapRaw(raw) {
      /**
       * strip notifications that defy the standard object layout
       * e.g. NType.NEWGROUP (501) doesn't have a hood_message
       * member. Skip everything but some standard messages
       * @todo proper error/NType handling
       * @type {Array.<Number>}
       */
      let safeTypes = [
        NType.EVENT,
        NType.MARKET,
        NType.ANSWER,
        NType.FEED
      ];

      let rawNItems = raw.notifications.filter((nitemRaw) => {
        let isSafe = safeTypes.includes(nitemRaw.notification_type_id);
        let notDeleted = !nitemRaw.hood_message.is_deleted;
        return isSafe && notDeleted;
      });

      return rawNItems.map((nitemRaw) => new NItem(nitemRaw));
    }
  };

  return NItem;
});
