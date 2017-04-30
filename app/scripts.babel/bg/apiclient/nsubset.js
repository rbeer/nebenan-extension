'use strict';

define(() => {

  /**
   * @class Super class for parsed data from API
   * @memberOf APIClient
   */
  class NSubset {

    /**
     * Takes an object and an array of keys to inherit from that object. The keys array
     * can also hold functions, which will be bound to `this` instance and invoked.
     * @param  {!Array.<(String|Function)>} keys - Keys to inherit or functions to invoke
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
