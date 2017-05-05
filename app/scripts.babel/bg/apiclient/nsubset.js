define([ 'lodash' ], (_) => {
  'use strict';
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
      // @if DEV=true
      this._raw = raw;
      // @endif

      keys.forEach((key) => {
        if (typeof key === 'function') {
          key.bind(this)();
        } else {
          this[key] = raw[key];
        }
      });

      /**
       * Name of extending class, i.e. constructor.name;e.g NItem, PCMEssage;
       * @type {String}
       * @memberOf APIClient.NSubset
       * @example
       * class ManyThings extends NSubset {
       *   constructor() { super(...); }
       * }
       *
       * let stash = new ManyThings();
       * stash.SUBSET_TYPE === 'ManyThings';
       * true
       */
      this.SUBSET_TYPE = this.constructor.name;
    }
  };

  return NSubset;

});
