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
     * only the members of interest to the extension.
     * @param {Object}   raw - Raw notification object as it comes from the API. The subset
     *                         will consist of:
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

      let wrapNType = function() {
        this.notification_type_id = new NType(raw.notification_type_id);
      };

      let extractMessage = function() {
        this.hood_message = new NMessage(raw.hood_message, raw.parent_hood_message);
      };

      let subsetKeys = [
        'id', wrapNType, extractMessage, 'created_at_timestamp', 'seen'
      ];
      super(subsetKeys, raw);
    }

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
