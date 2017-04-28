'use strict';

define([
  'bg/apiclient/nsubset',
  'bg/apiclient/nmessage',
  'bg/apiclient/ntype'
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
  };

  return NItem;

});
