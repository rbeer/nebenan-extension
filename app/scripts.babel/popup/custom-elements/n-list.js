'use strict';

define([
  'bg/apiclient/nsubset',
  'bg/apiclient/messages/pcitem',
  'popup/custom-elements/n-listitem',
  'popup/custom-elements/pc-listitem'
], (NSubset, PCItem, NListItem) => {

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
     * Adds a *ListItem to the list
     * @param {APIClient.NSubset|HTMLLIElement} setOrElement - Either an APIClient.NSubset to build from;
     *                                                         or a fully prepared, as in .populate
     *                                                         called, *ListItem.
     * @param {Boolean}                         atTop      - Insert ListItem at the top of the list
     * @returns {NListItem|PCListItem} - ListItem that has actually been added
     */
    add(setOrElement, atTop) {

      let listItem, elementName;

      let createElement = () => {
        let element = document.createElement(elementName);
        element.populate(setOrElement);
        return element;
      };

      switch (this.getAttribute('type')) {
        case 'notifications':
          elementName = 'n-listitem';
          break;
        case 'conversations':
          elementName = 'pc-listitem';
          break;
        default:
          throw new ReferenceError('n-list Element expects a ' +
                                   '\'type="notifications|conversations"\' attribute.');
      }

      if (setOrElement instanceof HTMLLIElement) {
        listItem = setOrElement;
      } else if (setOrElement instanceof NSubset) {
        listItem = createElement();
      } else {
        throw new TypeError('First parameter must be an instanceof ' +
                            'APIClient.NSubset or HTMLLIElement');
      }

      this.insertAdjacentElement(atTop ? 'afterbegin' : 'beforeend', listItem);
      return listItem;
    }

    setLeft(n) {
      this.style.left = n + 'px';
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('n-list', NList, { extends: 'ul' });

  return NList;

});
