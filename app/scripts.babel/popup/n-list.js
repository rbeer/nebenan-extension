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
        throw new TypeError('First parameter must be of type APIClient.NItem or NListItem');
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
      devlog(nItem);
      let tpl = document.getElementById('nlist-item');
      this.appendChild(document.importNode(tpl.content, true));
      return this;
    }

    /**
     * Fancy (animations 'n' stuff) extension of .remove
     */
    dismiss() {
      this.remove();
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
