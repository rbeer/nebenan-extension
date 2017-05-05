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
     * @param  {Object} partner - Object for the conversation partner user.
     *                            Should be parsable into an {@link APIClient.NUser} instance.
     * @return {APIClient.PCItem}
     */
    constructor(raw, partner) {

      let wrapMessage = function wrapMessage() {
        this.last_private_conversation_message =
          new PCMessage(raw.last_private_conversation_message);
      };
      let addPartner = function addPartner() {
        this.partner = new NUser(raw.partner || partner);
      };

      let subsetKeys = [
        'created_at', wrapMessage, 'partner_id', 'unseen', addPartner
      ];
      super(subsetKeys, raw);
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
