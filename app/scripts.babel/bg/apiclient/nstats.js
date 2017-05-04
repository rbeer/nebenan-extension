define(['bg/apiclient/nsubset'], (NSubset) => {

  class NStats extends NSubset {
    constructor(raw) {
      let compatibility_hack = function() {
        this.messages = 'new_messages_count';
        this.notifications = 'new_notifications_count';
      };
      super([ compatibility_hack ], raw);
      // TODO: use API's naming convention
      // let subsetKeys = [ 'new_messages_count', 'new_notifications_count' ];
      // super(subsetKeys, raw);
    }
  }

  return NStats;
});
