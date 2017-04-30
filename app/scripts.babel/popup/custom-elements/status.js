
define(() => {
  'use strict';

  class StatusElement extends HTMLDivElement {
    constructor() {
      super();
    }

    populate(type) {
      this.setAttribute('type', type);

      // clone DOM Elements from <template>
      // append to `this` <status-element>
      let tpl = document.getElementById('status-element');
      this.appendChild(document.importNode(tpl.content, true));

      this.firstElementChild.className = 'status-' + type;

      this.valueSpan = this.querySelector('span');
      this.value = 0;

      return this;
    }

    set value(n) {
      this.valueSpan.textContent = n;
    }
  }

  // register Custom Elements
  // using v0, since v1 is bugged in Blink
  // https://bugs.chromium.org/p/chromium/issues/detail?id=618606
  document.registerElement('status-element', StatusElement, { extends: 'div' });

  return StatusElement;

});
