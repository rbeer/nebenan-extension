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

      this.body = pcItem.last_private_conversation_message.body;
      this.thumb = pcItem.photo_thumb_url;

      return this;
    }

    set body(text) {
      this.querySelector('span.body').textContent = text;
    }

    set thumb(url) {
      devlog('setting thumb image to:', url);
      let thumbStyle = this.querySelector('span.thumb').style;
      thumbStyle.backgroundImage = `url(${url})`;
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('pc-listitem', PCListItem, { extends: 'li' });

  return PCListItem;
});
