'use strict';

define([
  'bg/apiclient/nitem',
  'bg/apiclient/ntype'
], (NItem, NType) => {

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

      // set element's attributes
      let nMsg = nItem.hood_message;
      let _typeId = nItem.notification_type_id.id;

      // answers and "thanks" link to their parent post
      let linkToParent = [ NType.ANSWER, NType.THANKS ].includes(_typeId);
      let linkId = linkToParent ? nMsg.parent_hood_message_id : nMsg.id;

      this.type = _typeId;
      this.id = nItem.id;
      this.seen = nItem.seen;

      this.title = nMsg.subject;
      this.body = nMsg.body;
      this.link = 'https://nebenan.de/feed/' + linkId;

      // set thumbnail
      this.setThumb(nMsg);

      return this;
    }

    set type(nTypeId) {
      this.setAttribute('type', nTypeId);
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

    set link(url) {
      this.setAttribute('link', url);
    }

    get link() {
      return this.getAttribute('link');
    }

    setThumb(nMessage) {

      let url;
      let thumbStyle = this.querySelector('.n-listitem-thumb').style;
      // use (first) image attached to message
      // or user's thumbnail
      // or random dummy avatar as last resort (based on sex)
      if (nMessage.images[0]) {
        url = nMessage.images[0].url_medium;
      } else if (nMessage.user.photo_thumb_url) {
        url = nMessage.user.photo_thumb_url;
      } else {
        let rnd = Math.floor(Math.random() * 6) + 1;
        // dummy avatars are all in one file
        // women on the left, men on the right;
        // 7 pictures, each -> 2x7 matrix
        url = '../images/usr_thumb_fallbacks.png';
        // 50px avatar width * 2 columns
        thumbStyle.backgroundSize = '100px';
        // offset background for males (right column)
        thumbStyle.backgroundPositionX = `${nMessage.user.sex_id * 50}px`;
        // random row
        thumbStyle.backgroundPositionY = `${rnd * 50}px`;
      }
      thumbStyle.backgroundImage = `url(${url})`;
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

  return NListItem;

});
