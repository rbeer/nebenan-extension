define(() => {
  'use strict';

  /**
   * @class Private Conversation Item for NList
   * @extends {HTMLLIElement}
   */
  class PCListItem extends HTMLLIElement {

    /**
     * @constructor
     * @memberOf PCListItem
     * @return {PCListItem}
     */
    constructor() {
      super();
    }

    /**
     * Populates new <pc-listitem> with initial values.
     * After this, the item must be ready to be displayed.
     * @param  {!APIClient.PCItem} pcItem - Data from API
     * @return {PCListItem} `this`
     */
    populate(pcItem) {

      let lastSenderId = pcItem.last_private_conversation_message.sender_id;
      let sent = lastSenderId !== pcItem.partner_id;

      // clone DOM Elements from <template>
      // append to `this` <n-listitem>
      let tpl = document.getElementById('pc-listitem');
      this.appendChild(document.importNode(tpl.content, true));
      devlog('populating PCListItem with:', pcItem);

      this.setAttribute('type', sent ? 'sent' : 'received');

      return this;
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('pc-listitem', PCListItem, { extends: 'li' });

  return PCListItem;
});
