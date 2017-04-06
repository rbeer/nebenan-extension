'use strict';

define(['bg/apiclient/nsubset'], (NSubset) => {

  /**
   * @class Message, linked to an NItem
   * @memberOf APIClient
   * @extends {APIClient.NSubset}
   */
  class NMessage extends NSubset {

    /**
     * Takes a raw hood_message object from the API and creates a subset with
     * only the members of interest to the extension.
     * @param  {Object}     raw                        - Raw hood_message object as it comes from the API. The subset will
     *                                                   consist of (a lot :smirk:):
     * @param {Number}   raw.id                        - Message's id
     * @param {Number}   raw.created                   - UNIX epoch timestamp, millisecond precision
     * @param {Number}   raw.user_id                   - Author's id
     * @param {Number}   raw.hood_message_type_id      - ! UNKNOWN !
     * @param {Number}   raw.hood_message_category_id  - ! UNKNOWN !
     * @param {?Number}  raw.hood_group_id             - Id of group, message was posted in
     * @param {String}   raw.body                      - Message body
     * @param {Number}   raw.hood_id                   - Id of author's hood
     * @param {String}   raw.subject                   - Message's title
     * @param {Bool}     raw.house_group               - Whether message's author lives in the same house
     * @param {Object[]} raw.images                    - Images, embedded in post
     * @param {Number}   raw.images.id                 - Image's id
     * @param {String}   raw.images.url                - Image's url
     * @param {String}   raw.images.url_medium         - Image's url (medium size/thumb)
     * @param {Object}   raw.user                      - Message's author
     * @param {Number}   raw.user.id                   - Author's id
     * @param {String}   raw.user.firstname            - Author's first name
     * @param {String}   raw.user.lastname             - Author's last name (might be shortened to (\w\.) )
     * @param {String}   raw.user.photo_thumb_url      - Auhtor's profile image (thumbnail size)
     * @param {Number}   raw.user.hood_id              - ID of author's hood
     * @param {String}   raw.user.hood_title           - Name of author's hood
     * @constructor
     * @return {NMessage}
     */
    constructor(raw) {

      let userSubsetKeys = [
        'id', 'firstname', 'lastname',
        'photo_thumb_url', 'hood_id', 'hood_title'
      ];

      let slimUser = function() {
        this.user = new NSubset(userSubsetKeys, raw.user);
      };

      let subsetKeys = [
        'id', 'created', 'user_id',
        'body', 'subject', 'images',
        'hood_message_type_id', 'hood_message_category_id', 'hood_group_id',
        'hood_id', 'house_group', slimUser
      ];
      super(subsetKeys, raw);
    }
  };

  return NMessage;

});