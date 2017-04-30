'use strict';

define([
  'bg/apiclient/notifications/nsubset',
  'bg/apiclient/notifications/nmessage-type'
], (NSubset, NMessageType) => {

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
     * @param {Number}   raw.hood_message_type_id      - Id of message type (e.g. deleted = 4)
     * @param {?Number}  raw.hood_group_id             - Id of group, message was posted in
     * @param {?Number}  raw.parent_hood_message_id    - ID of parent message (used for links to e.g. "thanks" or answer messages)
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
     * @param {String}   raw.user.sex_id               - Author's sex (0: female, 1: male)
     * @param {?Object}  parentMessage                 - Message's parent Message. Used for e.g. title generation of NType.ANSWER Messages
     * @constructor
     * @return {NMessage}
     */
    constructor(raw, parentMessage) {

      let userSubsetKeys = [
        'id', 'firstname', 'lastname', 'sex_id',
        'photo_thumb_url', 'hood_id', 'hood_title'
      ];

      let slimUser = function() {
        this.user = new NSubset(userSubsetKeys, raw.user);
      };

      let subsetKeys = [
        'id', 'created', 'user_id', 'parent_hood_message_id',
        'body', 'subject', 'images',
        'hood_message_type_id', 'hood_group_id',
        'hood_id', 'house_group', slimUser
      ];
      super(subsetKeys, raw);

      if (parentMessage) {
        this.parentSubject = parentMessage.subject;
      }
    }
  };

  return NMessage;

});
