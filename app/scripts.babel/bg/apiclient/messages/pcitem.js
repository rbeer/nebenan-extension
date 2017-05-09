define([
  'bg/apiclient/nsubset',
  'bg/apiclient/nuser',
  'bg/apiclient/messages/pcmessage',
  'lodash'
], (NSubset, NUser, PCMessage, _) => {
  'use strict';

  /**
   * @class Private Conversation
   * @memberOf APIClient
   * @extends {APIClient.NSubset}
   */
  class PCItem extends NSubset {

    /**
     * Takes a raw conversation object from the API and creates a subset with
     * members of interest to the extension. Only those subset members are documented.
     * @param  {Object} raw
     * @param  {Number} raw.created_at_timestamp - ISOString: `raw.created_at` -> Number: `this.created_at_timestamp`
     * @param  {APIClient.PCMessage} raw.last_private_conversation_message
     * @param  {Number} raw.partner_id
     * @param  {Boolean} raw.unseen
     * @param  {APIClient.NUser} raw.partner
     * @param  {Object} partner - Object for the conversation partner user.
     *                            Should be parsable into an {@link APIClient.NUser} instance.
     * @return {APIClient.PCItem}
     */
    constructor(raw, partner) {

      let customSetters = function customSetters() {
        // wrap last message in PCMessage instance
        this.last_private_conversation_message =
          new PCMessage(raw.last_private_conversation_message);

        // wrap partner in NUser instance
        this.partner = new NUser(raw.partner || partner);

        // convert created_at ISOString to timestamp Number
        this.created_at_timestamp = raw.created_at_timestamp ||
                                    (new Date(raw.created_at)).valueOf();
      };

      let subsetKeys = [
        'partner_id', 'unseen', customSetters
      ];
      super(subsetKeys, raw);
      this.SUBSET_TYPE = raw.SUBSET_TYPE || 'PCItem';
    }

    /**
     * Takes an API response and returns an Array of {@link APIClient.PCItem}
     * @param  {Object} raw - {@link APIClient.XHRRequest}.responseData
     * @see APIClient.wrapResponse
     * @see APIClient.XHRRequest
     * @return {Array.<APIClient.PCItem>}
     */
    static wrapRaw(raw) {
      let conversations = raw.private_conversations;
      let linked_users = raw.linked_users;

      return conversations.map((conversation) => {
        let partner = _.find(linked_users, [ 'id', conversation.partner_id]);
        return new PCItem(conversation, partner);
      });
    }

  }

  return PCItem;
});
