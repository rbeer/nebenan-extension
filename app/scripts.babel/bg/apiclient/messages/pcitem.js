define([
  'bg/apiclient/nsubset',
  'bg/apiclient/messages/pcmessage'
], (NSubset, PCMessage) => {
  'use strict';

  class PCItem extends NSubset {
    constructor(raw, partner) {

      let wrapMessage = function wrapMessage() {
        this.last_private_conversation_message =
          new PCMessage(raw.last_private_conversation_message);
      };
      let addThumbUrl = function addThumbUrl() {
        this.thumb_url = partner.photo_thumb_url;
      };

      let subsetKeys = [
        'created_at', wrapMessage, 'partner_id', 'unseen', addThumbUrl
      ];
      super(subsetKeys, raw);
    }

  }

  return PCItem;
});
