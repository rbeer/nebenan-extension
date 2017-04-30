'use strict';

define([
  'bg/apiclient/nitem',
  'popup/custom-elements/n-listitem'
], (NItem, NListItem) => {

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
     * @returns {NListItem} - NListItem that has actually been added
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
      return nListItem;
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('n-list', NList, { extends: 'ul' });

  return NList;

});
