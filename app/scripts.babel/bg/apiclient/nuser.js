define([ 'bg/apiclient/nsubset', 'lodash' ], (NSubset, _) => {
  'use strict';

  /**
   * @class User Data
   * @memberOf APIClient
   */
  class NUser extends NSubset {
    constructor(raw, additionalKeys) {
      let userSubsetKeys = [
        'id', 'firstname', 'lastname', 'sex_id',
        'photo_thumb_url', 'hood_id', 'hood_title'
      ];

      if (additionalKeys) {
        additionalKeys = typeof additionalKeys === 'string' ? [ additionalKeys ] :
                                                              additionalKeys;
      }
      super(_.union(userSubsetKeys, additionalKeys), raw);
    }
  }

  return NUser;

});
