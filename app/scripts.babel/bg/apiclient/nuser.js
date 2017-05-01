define([ 'bg/apiclient/nsubset', 'lodash' ], (NSubset, _) => {
  'use strict';

  /**
   * @class User Data
   * @memberOf APIClient
   */
  class NUser extends NSubset {
    /**
     * Inherits NUser.SUBSET_DEFAULT_KEYS and `additionalKeys` from a `raw` user object
     * @constructor
     * @param  {Object} raw            - user object
     * @param  {String|Array.<String>} additionalKeys - single key as String or Array of Strings
     */
    constructor(raw, additionalKeys) {

      if (additionalKeys) {
        additionalKeys = typeof additionalKeys === 'string' ? [ additionalKeys ] :
                                                              additionalKeys;
      }
      super(_.union(NUser.SUBSET_DEFAULT_KEYS, additionalKeys), raw);
    }

    /**
     * Default keys to inherit from raw user object
     * @memberOf APIClient.NUser
     * @property {Number}  id
     * @property {String}  firstname
     * @property {String}  lastname
     * @property {Number}  sex_id
     * @property {?String} photo_thumb_url
     * @property {Number}  hood_id
     * @property {String}  hood_title
     * @example
     * console.log(NUser.SUBSET_DEFAULT_KEYS)
     * [ 'id', 'firstname', 'lastname', 'sex_id',
     *  'photo_thumb_url', 'hood_id', 'hood_title' ]
     */
    static get SUBSET_DEFAULT_KEYS() {
      return [
        'id', 'firstname', 'lastname', 'sex_id',
        'photo_thumb_url', 'hood_id', 'hood_title'
      ];
    }
  }

  return NUser;

});
