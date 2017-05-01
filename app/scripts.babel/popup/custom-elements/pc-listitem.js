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
     * After this, the item must be ready for display.
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

      // set attributes
      this.type = sent ? 'sent' : 'received';
      this.partner_id = pcItem.partner_id;

      // set attributes for/on clickable elements
      let body = this.querySelector('span.body');
      body.setAttribute('aria-role', 'button');
      body.setAttribute('action', 'newtab.messages/' + this.partner_id);

      // set contents
      this.body = pcItem.last_private_conversation_message.body;
      this.thumb = pcItem.partner.photo_thumb_url;

      return this;
    }

    set type(type) {
      this.setAttribute('type', type);
      return this.getAttribute('type');
    }
    get type() {
      return this.getAttribute('type');
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
