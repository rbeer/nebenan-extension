'use strict';

define(() => {

  /**
   * @class Super class for parsed data from API
   * @memberOf APIClient
   */
  class NSubset {

    /**
     * Takes an object and an array of keys to inherit from that object.
     * @param  {!Array.<String>} keys - Keys to inherit
     * @param  {!Object}         raw  - Any object; it should have members
     *                                  with given keys, of course
     * @return {NSubset}
     */
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
