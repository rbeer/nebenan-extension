define([ 'bg/apiclient/nsubset' ], (NSubset) => {
  'use strict';

  class PCMessage extends NSubset {
    constructor(raw) {

      let subsetKeys = [
        'id', 'body', 'created_at_timestamp', 'receiver_id', 'sender_id'
      ];

      super(subsetKeys, raw);
    }
  }

  return PCMessage;
});
