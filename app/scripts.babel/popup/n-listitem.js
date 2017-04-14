'use strict';

define(() => {

  /**
   * @class Item for NList
   * @extends {HTMLElement}
   * @example
   * ...
   *   <n-list>
   *     <n-listitem>...</n-listitem>
   *   </n-list>
   * ...
   */
  class NListItem extends HTMLLIElement {

    /**
     * @typedef {Object} NListItemData
     * @property {Number}   id
     * @property {Number}   created - UNIX epoch timestamp, millisecond precision
     * @property {NType}    typeId  - Notification type id (NListItem.NType)
     * @property {NMessage} message - Message that caused the notification
     * @memberOf NListItem
     */

    /**
     * @constructor
     * @memberOf NListItem
     * @returns {NListItem}
     */
    constructor() {
      super();
    }

    /**
     * Populates new <n-listitem> with initial values.
     * After this, the item must be ready to be displayed.
     * @param {!APIClient.NItem} nItem - Data from API
     * @return {NListItem} `this`
     */
    populate(nItem) {
      if (!(nItem instanceof NItem)) {
        throw new TypeError('NListItem needs an APIClient.NItem instance' +
                            'to be populate with.');
      }

      // clone DOM Elements from <template>
      // append to `this` <n-listitem>
      let tpl = document.getElementById('n-listitem');
      this.appendChild(document.importNode(tpl.content, true));

      // dismiss click
      this.querySelector('[aria-role="button"]')
          .addEventListener('click', this.dismiss.bind(this));

      // set stuff
      this.type = nItem.notification_type_id;
      this.id = nItem.id;
      this.seen = nItem.seen;
      this.title = nItem.hood_message.subject;
      this.body = nItem.hood_message.body;
      this.link = nItem.hood_message.id;

      return this;
    }

    set type(nType) {
      this.setAttribute('type', nType.id);
    }

    set id(id) {
      this.setAttribute('id', id);
    }

    set seen(hasSeen) {
      this.setAttribute('seen', true);
    }

    set title(text) {
      this.setAttribute('title', text);
      this.querySelector('.n-listitem-title').innerText = text;
    }

    set body(text) {
      let singleLine = text.slice(0, 52).replace(/\n/g, ' ');
      this.setAttribute('body', singleLine);
      this.querySelector('.n-listitem-body').innerText = singleLine;
    }

    set link(messageId) {
      let url = 'https://nebenan.de/feed/' + messageId;
      this.setAttribute('link', url);
    }

    get link() {
      return this.getAttribute('link');
    }

    /**
     * Removes item from list
     * @return {Promise} - Resolves when item has been removed from DOM
     */
    dismiss() {
      return this.slideOut().then(this.remove.bind(this));
    }

    hookLink(handler) {
      this.querySelector('.n-listitem-body')
          .addEventListener('click', handler.bind(this, 'newtab.' + this.link));
    }

    slideIn() {}
    slideOut() {
      let self = this;
      return new Promise((resolve) => {
        self.addEventListener('transitionend', resolve);
        self.classList.add('out');
      });
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('n-listitem', NListItem, { extends: 'li' });

  return true;

});
