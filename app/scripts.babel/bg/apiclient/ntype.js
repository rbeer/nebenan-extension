'use strict';

define(() => {

  /**
   * @class Notification Type
   * @memberOf APIClient
   * @throws {ReferenceError} If invoked. Class is static.
   */
  class NType {
    /**
     * @constructor
     */
    constructor(id) {
      this.id = id;
      this.ntype = NType.ID_MAP[id];
    }

    static get ID_MAP() {
      return {
        300: 'EVENT',
        400: 'MARKET',
        401: 'ANSWER',
        702: 'JOIN',
        1200: 'FEED'
      };
    }

    /**
     * **400** - Marketplace notification
     */
    static get MARKET() {
      return 400;
    }
    /**
     * **1200** - Feed notification
     */
    static get FEED() {
      return 1200;
    }
    /**
     * **300** - Event/Meeting notification
     */
    static get EVENT() {
      return 300;
    }
    /**
     * **320** - ????????
     */
    /*static get () {
      return 320;
    }*/
    /**
     * **401** - Answer/Comment notification
     */
    static get ANSWER() {
      return 401;
    }
    /**
     * **702** - User join notification
     */
    static get JOIN() {
      return 702;
    }
  }

  return NType;

});
