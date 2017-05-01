define([
  'bg/apiclient/nsubset',
  'bg/apiclient/nuser',
  'bg/apiclient/messages/pcmessage'
], (NSubset, NUser, PCMessage) => {
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

  }

  return PCItem;
});
