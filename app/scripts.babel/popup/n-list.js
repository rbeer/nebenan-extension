'use strict';

define(['bg/apiclient/nitem'], (NItem) => {

  /**
   * @class Notification List
   * @extends {HTMLUListElement}
   * @example
   * ...
   * <body>
   *  <n-list>...</n-list>
   * </body>
   * ...
   */
  class NList extends HTMLUListElement {

    constructor() {
      super();
    }

    /**
     * Adds an NListItem to the list
     * @param {!APIClient.NItem|NListItem} nItem - Either an APIClient.NItem to build an
     *                                             NListeItem from; or a fully prepared,
     *                                             as in .populate called, NListItem.
     */
    add(nItem) {
      let nListItem;
      if (nItem instanceof NListItem) {
        nListItem = nItem;
      } else if (nItem instanceof NItem) {
        nListItem = document.createElement('n-listitem');
        nListItem.populate(nItem);
      } else {
        throw new TypeError('First parameter must be of type ' +
                            'APIClient.NItem or NListItem');
      }
      this.append(nListItem);
    }
  }

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

    /**
     * Fancy (animations 'n' stuff) extension of .remove
     */
    dismiss() {
      this.remove();
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
      this.querySelector('.n-listitem-body a').innerText = singleLine;
    }

    set link(messageId) {
      let url = 'https://nebenan.de/feed/' + messageId;
      this.setAttribute('link', url);
      this.querySelector('.n-listitem-body a').setAttribute('href', url);
    }

    slideIn() {}
    slideOut() {}
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('n-list', NList, { extends: 'ul' });
  document.registerElement('n-listitem', NListItem, { extends: 'li' });

  return true;

});
