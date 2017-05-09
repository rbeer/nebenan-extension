define(() => {
  'use strict';

  class StatusElement extends HTMLDivElement {
    constructor() {
      super();
    }

    populate(type) {
      this.setAttribute('type', type);

      /** Element/Children Setup */
      // clone DOM Elements from <template>
      // append to `this` <status-element>
      let tpl = document.getElementById('status-element');
      this.appendChild(document.importNode(tpl.content, true));

      this.firstElementChild.className = 'status-' + type;

      /** Clickable Setup */
      this.setAttribute('aria-role', 'button');
      this.setAttribute('action', 'select-panel.' + this.type);

      /** Set Initial Counter Value */
      this.valueSpan = this.querySelector('span');
      this.value = 0;

      return this;
    }

    /**
     * Sets # of notifications on this status-element
     * @param  {Number} n - Notification count to display on this element
     * @return {Boolean} Whether the element has been set to active (i.e. n > 0)
     */
    set value(n) {
      this.valueSpan.textContent = n;
      this.active = n > 0;
      return this.active;
    }
    set active(toState) {
      (toState ? this.setAttribute : this.removeAttribute).call(this, 'active', '');
      return this.active;
    }
    get active() {
      return this.hasAttribute('active');
    }
    get value() {
      return parseInt(this.valueSpan.textContent, 10);
    }
    get type() {
      return this.getAttribute('type');
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('status-element', StatusElement, { extends: 'div' });

  return StatusElement;

});
