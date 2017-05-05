define([
  'bg/apiclient/nsubset',
  'bg/apiclient/nuser',
  'bg/apiclient/messages/pcmessage',
  'lodash'
], (NSubset, NUser, PCMessage, _) => {
  'use strict';

  class PCItem extends NSubset {
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
