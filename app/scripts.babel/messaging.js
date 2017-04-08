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
      typeError(!handlers,
                'Messaging needs a set of handlers.',
                'ENOSETOHANDLERS');
      typeError((typeof parentId !== 'string'),
                'Messaging needs a parentId to identify itself (Message.sender).',
                'ENOPARENTID');
      this.handlers = handlers;
      // @if DEV=true
      this.handlers.dev = (message, respond) => {
        devlog('Receiving message:', message);
      };
      // @endif
      this.parentId = parentId;
    }

    static get Message() {
      return Message;
    }

    listen() {
      devlog('Listening to incoming Messages ...');
      chrome.runtime.onMessage.addListener(this.receive.bind(this));
    }

    /**
     * Receives message
     * @param  {Object}     message -
     * @param  {?Object}    sender  - Sender information from Chrome API
     * @param  {?Function}  respond - Respond to message
     * @return {Bool} - Always returns `true` to keep port open for response
     */
    receive(message, sender, respond) {
      // ignore messages not for this instance
      if (message.to === this.parentId) {
        // handle initial messages
        // } else {
        // handle response messages
        if (true) {
          let self = this;
          devlog(message);
          let msg = Message.fromObject(message);

          msg.handlers.forEach((handler) => {
            self.handlers[handler].call(self, msg, respond);
          });

          // @if DEV=true
          this.handlers.dev.call(this, msg);
          // @endif

        }
      }

      return true;
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

      chrome.runtime.sendMessage(message.toObject(), (response) => {
        if (!response) {
          console.error('Sending a message has failed.');
          return console.error(chrome.runtime.lastError);
        }
        devlog('RESPONSE:', response);
        self.receive(response);
        return true;
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
      Messaging.sendMessage.call(this, m);
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
     * Creates new Message instance from an Object
     * @param  {!Object} obj - Object you want to turn into a Message
     * @return {Messaging.Message}
     */
    static fromObject(obj) {
      typeError(!obj,
                'From what object, exactly?',
                'ENOOBJECT');

      let params = [ null ];
      for (let key in obj) {
        params.push(obj[key]);
      }

      let m = new (Function.prototype.bind.apply(Message, params));
      m.trigger = obj.trigger;
      return m;
    }

    /**
     * Creates a response (new) Message, based on `this` instance
     * and with passed set of handler names and payload
     * @param  {!String|!Array.<String>} handlers - Set of handler names the receiving end
     *                                      should handle the response Message with
     * @param  {?Object}         payload  - Payload data, e.g. stats object on 'getStats'
     * @return {Messaging.Message} - New instance of Message, serving as response to `this`
     */
    cloneForAnswer(handlers, payload) {
      typeError(((typeof handlers !== 'string') && !(handlers instanceof Array)),
                'Message needs one or more handler names.',
                'ENOHANDLER');

      let bareClone = {
        sender: this.to,
        to: this.sender,
        handlers: (typeof handlers === 'string') ? [ handlers ] : handlers,
        payload: payload,
        trigger: this.toObject()
      };
      devlog(bareClone);
      let clone = Message.fromObject(bareClone);
      return clone;
    }

    /**
     * Returns instance's data as clean object.
     * @type {Object}
     */
    toObject() {
      let obj = {
        sender: this.sender,
        to: this.to,
        handlers: this.handlers,
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
