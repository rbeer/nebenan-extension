'use strict';

define(() => {

  /**
   * @class Notification Type
   * @memberOf APIClient
   */
  class NType {
    /**
     * @constructor
     */
    constructor(id) {
      this.id = typeof id === 'number' ? id : id.id;
      this.ntype = NType.ID_MAP[this.id];
    }

    static get ID_MAP() {
      return {
        300: 'EVENT',
        309: 'POLL',
        400: 'FEED',
        401: 'ANSWER',
        404: 'THANKS',
        501: 'NEWGROUP',
        702: 'JOIN',
        1200: 'MARKET'
      };
    }

    /**
     * **300** - Event/Meeting notification
     */
    static get EVENT() {
      return 300;
    }

    static get POLL() {
      return 309;
    }

    /**
     * **320** - ????????
     */
    /*static get () {
      return 320;
    }*/

    /**
     * **400** - Feed notification
     */
    static get FEED() {
      return 400;
    }

    /**
     * **401** - Answer/Comment notification
     */
    static get ANSWER() {
      return 401;
    }

    /**
     * **404** - Notification when message/answer receives thank you
     */
    static get THANKS() {
      // web developers associating "thank you" with 404. must be sarcasm. :3
      return 404;
    }

    /**
     * **501** - Notification when a new group has been created
     */
    static get NEWGROUP() {
      // web developers associating "thank you" with 404. must be sarcasm. :3
      return 501;
    }

    /**
     * **702** - User join notification
     */
    static get JOIN() {
      return 702;
    }

    /**
     * **1200** - Marketplace notification
     */
    static get MARKET() {
      return 1200;
    }
  }

  return NType;

});
