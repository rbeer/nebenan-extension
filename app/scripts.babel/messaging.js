'use strict';

define(['lodash'], (_) => {

  let typeCheck = (failCondition, msg, code) => {
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
     * @param  {!Object.<String, Function>} handlers - Set of handlers, Messages can
     *                                                 request to be handled by
     * @param  {!String}                    parentId - Module id of parent, serving as sender
     * @return {Messaging}
     */
    constructor(handlers, parentId) {
      typeCheck(!handlers,
                'Messaging needs a set of handlers.',
                'ENOSETOHANDLERS');
      typeCheck((typeof parentId !== 'string'),
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

    ping(to) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          to: to,
          payload: 'ping'
        }, (response) => {
          devlog(response);
          if (!response) {
            resolve();
          } else {
            resolve('pong');
          }
        });
      });
    }

    /**
     * Receives message
     * @param  {Object}     message - Message object (not yet an instance!), received
     * @param  {?Object}    sender  - Sender information from Chrome API
     * @param  {?Function}  respond - Respond to message
     * @return {Bool} - Always returns `true` to keep port open for response
     */
    receive(message, sender, respond) {
      // ignore messages not for this instance
      if (message.to === this.parentId) {
        let self = this;

        if (message.payload === 'ping') {
          return respond('pong');
        }

        // create Message instance
        let msg = new Message(message);

        // find matching handlers (intersection available/requested)
        let mhandlers = _.intersection(msg.handlers, Object.keys(this.handlers));

        mhandlers.forEach((handler) => {
          self.handlers[handler].call(self, msg, respond);
        });

        // @if DEV=true
        this.handlers.dev.call(this, msg);
        // @endif
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
      typeCheck(!(this instanceof Messaging),
                'sendMessage must be bound to an instanece of Messaging.',
                'ENOMESSAGINGTHIS');
      typeCheck(!(message instanceof Message),
                'sendMessage expects \'message\' to be an instance of Messaging.Message.',
                'ENOMESSAGE');

      let self = this;

      chrome.runtime.sendMessage(message.toObject(), (response) => {
        if (!response) {
          let crx_le = chrome.runtime.lastError;

          console.error('Sending a Message has failed.');
          console.error(message);
          console.error(chrome.runtime.lastError);
          if (crx_le.message.includes('before a reponse was received')) {
            console.warn('Did you call the `respond` callback in the message ' +
                         'handler on the other end?');
          }
          return;
        }
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
     * The constructor of is overloaded to accept
     * the data as single Object parameter
     * @param  {!String|Object}         sender    - Sender of the message
     * @param  {!String}                sender.sender    - Sender of the message
     * @param  {!String}                sender.to        - Recipient of the message
     * @param  {String|Array.<String>} sender.handlers  - Name(s) of the Messaging handler(s) that should receive this message
     * @param  {?Object}                sender.payload   - Message payload data
     * @param  {?Messaging.Message}     sender.trigger   - Message got triggered by this request Message
     * @param  {!String}                to        - Recipient of the message
     * @param  {String|Array.<String>} handlers  - Name(s) of the Messaging handler(s) that should receive this message
     * @param  {?Object}                payload   - Message payload data
     * @return {Messaging.Message}
     */
    constructor(sender, to, handlers, payload) {

      let data = {
        sender: sender,
        to: to,
        handlers: handlers,
        payload: payload,
        trigger: null
      };
      _.assign(data, typeof sender === 'object' ? sender : {});

      typeCheck((typeof data.sender !== 'string'),
                'Message needs a sender of type string.',
                'ENOSENDER');
      typeCheck((typeof data.to !== 'string'),
                'Message needs a recipient (to).',
                'ENOTO');
      typeCheck(((typeof data.handlers !== 'string') &&
                  !(data.handlers instanceof Array)),
                'Message needs one or more handler names.',
                'ENOHANDLER');

      /**
       * Name of Message sender
       * @type {!String}
       * @memberOf Messaging.Message
       */
      this.sender = data.sender;
      /**
       * Name of message recipient
       * @type {!String}
       * @memberOf Messaging.Message
       */
      this.to = data.to;
      /**
       * Names of handlers on the receiving end, expected
       * to process this Message
       * @type {!Array.<String>}
       * @memberOf Messaging.Message
       */
      this.handlers = typeof data.handlers === 'string' ? [ data.handlers ] :
                                                          data.handlers;
      /**
       * Payload data to send with the Message
       * @type {?Object}
       * @memberOf Messaging.Message
       */
      this.payload = data.payload || null;
      /**
       * Message (.toObject) that triggered this Message
       *   - Message is a trigger itself, if `null`
       * @type {?Object}
       * @memberOf Messaging.Message
       */
      this.trigger = data.trigger;
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
      typeCheck(((typeof handlers !== 'string') && !(handlers instanceof Array)),
                'Message needs one or more handler names.',
                'ENOHANDLER');

      let bareClone = {
        sender: this.to,
        to: this.sender,
        handlers: handlers,
        payload: payload,
        trigger: this.toObject()
      };
      let clone = new Message(bareClone);
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
        handlers: this.handlers
      };
      if (this.payload !== null) {
        obj.payload = this.payload;
      }
      if (this.trigger !== null) {
        obj.trigger = this.trigger;
      }
      return obj;
    }

  }

  return Messaging;

});
