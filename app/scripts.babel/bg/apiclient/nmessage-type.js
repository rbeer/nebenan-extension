'use strict';

define(() => {

  /**
   * @class Message Type
   * @memberOf APIClient
   */
  class NMessageType {
    /**
     * @constructor
     */
    constructor(id) {
      this.id = typeof id === 'number' ? id : id.id;
      for (let mappedId in NMessageType.ID_MAP) {
        Object.defineProperty(this, NMessageType.ID_MAP[mappedId], {
          get: () => mappedId
        });
      }
    }

    static get ID_MAP() {
      return {
        1: 'NORMAL',
        4: 'DELETED'
      };
    }
  }

  return NMessageType;

});
