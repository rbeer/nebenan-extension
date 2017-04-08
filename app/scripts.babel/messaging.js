'use strict';

define(() => {

  let typeError = (failCondition, msg, code) => {
    if (failCondition) {
      let err = new TypeError(msg);
      err.code = code;
      throw err;
    }
  };

  /**
   * @class Handles messaging between background and popup app
   */
  class Messaging {

    /**
     * @param  {!Object.<String, Function>} handlers -
     * @param  {!String} parentId - Module id of parent, serving as sender
     * @return {Messaging}
     */
    constructor(handlers, parentId) {
      typeError(!(handlers instanceof Array),
                'Messaging needs a set of handlers.',
                'ENOSETOHANDLERS');
      typeError((typeof parentId !== 'string'),
                'Messaging needs a parentId to identify itself (Message.sender).',
                'ENOPARENTID');
      this.handlers = handlers;
      // @if DEV=true
      this.handlers.dev = (response) => {
        devlog('Receiving message:', response);
      };
      // @endif
      this.parentId = parentId;

      devlog('Listening to incoming Messages ...');
      chrome.runtime.onMessage.addListener(this.receive);
    }

    receive(message) {
      // @if DEV=true
      this.handler.dev();
      // @endif
    };

    /**
     * Sends a Message instance
     * @param  {Messaging.Message} message - Message instance to send
     * @this    Messaging                 - Messaging instance sending the message
     * @throws {TypeError} If `this` is not an instance of Messaging
     */
    static sendMessage(message) {
      typeError(!(this instanceof Messaging),
                'sendMessage must be bound to an instanece of Messaging.',
                'ENOMESSAGINGTHIS');
      typeError(!(message instanceof Message),
                'sendMessage expects \'message\' to be an instance of Messaging.Message.',
                'ENOMESSAGE');
      let self = this;

      chrome.runtime.sendMessage(message.toObject, (response) => {
        if (!response) {
          console.error('Sending a message has failed.');
          return console.error(chrome.runtimes.lastError);
        }
        self.receive(response);
      });
    }

    /**
     * Sends a Message, constructed from given parameters
     *  - sender is added from Messaging.parentId
     * @see Messaging.Message
     * @param  {!String}         to       Recipient of the message
     * @param  {!Array.<String>} handlers Names of the Messaging handlers that should
     *                                    receive this message on recipients end
     * @param  {?Object}         payload  Message payload data
     */
    send(to, handlers, payload) {
      let m = new Message(this.parentId, to, handlers, payload);
      Messaging.sendMessage(m);
    }

    static get Message() {
      return Message;
    }
  }

  /**
   * @class Message sent between background and popup app
   * @memberOf Messaging
   */
  class Message {

    /**
     * Constructs new message
     * @param  {!String}                sender    - Sender of the message
     * @param  {!String}                to        - Recipient of the message
     * @param  {!String|Array.<String>} handlers  - Name(s) of the Messaging handler(s) that should receive this message
     * @param  {?Object}                payload   - Message payload data
     * @return {Messaging.Message}
     */
    constructor(sender, to, handlers, payload) {
      typeError((typeof sender !== 'string'),
                'Message needs a sender of type string.',
                'ENOSENDER');
      typeError((typeof to !== 'string'),
                'Message needs a recipient (to).',
                'ENOTO');
      typeError(((typeof handlers !== 'string') && !(handlers instanceof Array)),
                'Message needs one or more handler names.',
                'ENOHANDLER');
      /**
       * Name of Message sender
       * @type {!String}
       * @memberOf Messaging.Message
       */
      this.sender = sender;
      /**
       * Name of message recipient
       * @type {!String}
       * @memberOf Messaging.Message
       */
      this.to = to;
      /**
       * Names of handlers on the receiving end, expected
       * to process this Message
       * @type {!Array.<String>}
       * @memberOf Messaging.Message
       */
      this.handlers = typeof handlers === 'string' ? [ handlers ] : handlers;
      /**
       * Payload data to send with the Message
       * @type {?Object}
       * @memberOf Messaging.Message
       */
      this.payload = payload || null;
      /**
       * Message (.toObject) that triggered this Message
       *   - Message is a trigger itself, if `null`
       * @type {Object}
       * @memberOf Messaging.Message
       */
      this.trigger = null;
    }

    /**
     * Returns instance's data as clean object.
     * @type {Object}
     */
    get toObject() {
      let obj = {
        sender: this.sender,
        to: this.to,
        handler: this.handler,
        trigger: this.trigger
      };
      if (this.payload !== null) {
        obj.payload = this.payload;
      }
      return obj;
    }

  }

  return Messaging;

});
