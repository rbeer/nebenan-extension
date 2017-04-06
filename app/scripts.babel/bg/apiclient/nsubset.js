'use strict';

define(() => {

  class NSubset {
    constructor(keys, raw) {

      keys.forEach((key) => {
        if (typeof key === 'function') {
          key.bind(this)();
        } else {
          this[key] = raw[key];
        }
      });
    }
  };

  return NSubset;

});
