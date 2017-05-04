'use strict';

define([
  'messaging',
  'popup/ui',
  'bg/apiclient/notifications/nitem',
  'bg/apiclient/messages/pcitem'
], (Messaging, ui, NItem, PCItem) => {

  window.devlog = console.debug;

  /**
   * BrowserAction popup main app
   * @module popup/app
   */
  let popupApp = window.popupApp = {
    ui: ui,
    messaging: null             // -> .init()
  };

  /**
   * Initializes main app
   * - Initializes messaging
   * - Queries module:bgApp for initial data (stats, notifications, conversations)
   * @memberOf module:popup/app
   */
  popupApp.init = () => {

    // init Messaging
    popupApp.messaging = new Messaging({
      setStats: popupApp.setStats,                           // response for bg/app:getStats
      updateStats: popupApp.setStats.bind(null, true),       // push message from bg/app:updateStats
      addNotifications: popupApp.addNotifications,           // response for bg/app:getNotifications
      addNotificationsAtTop: popupApp.addNotificationsAtTop, // response for bg/app:getNotifications {type: 'update' }
      addConversations: popupApp.addConversations,           // response for bg/app:getConversations
      error: handleErrorMessages
    }, 'popup/app');

    popupApp.messaging.listen();

    // finish init when DOM is loaded
    document.addEventListener('DOMContentLoaded', initWithDOMLoaded);
  };

  let initWithDOMLoaded = () => {

    // init UI
    popupApp.ui.init(popupApp).then(() => {
      // query bgApp for stats
      popupApp.messaging.send('bg/app', ['getStats']);
      // query bgApp for notifications
      popupApp.messaging.send('bg/app', ['getNotifications']);
      // query bgApp for private_conversations
      popupApp.messaging.send('bg/app', ['getConversations']);
    }).catch((err) => console.error('popupApp.ui failed!', err));

  };

  popupApp.setStats = (update, msg) => {

    if (!msg) {
      msg = update;
      update = false;
    }

    // update UI elements
    popupApp.ui.setStats({
      conversations: msg.payload.messages || 0,
      notifications: msg.payload.notifications || 0
    }, update);
  };

  popupApp.addNotifications = (msg, atTop) => {
    let items = [];
    msg.payload.forEach((nItemObject) => {
      let nitem = new NItem(nItemObject);
      items.push(popupApp.ui.addNotification(nitem, atTop));
    });
    popupApp.ui.setLoadingDone().then(() => {
      // TODO: 'init' class is taken off too quickly; delay
      let _show = () => {
        items.forEach((item, i) => item.slideIn(i / 10));
      };
      if (atTop) {
        window.setTimeout(_show, 250);
      } else {
        _show();
      }
    });
  };

  popupApp.addNotificationsAtTop = (msg) => popupApp.addNotifications(msg, true);

  popupApp.addConversations = (msg) => {
    msg.payload.forEach((pcItemObject) => {
      let pcItem = new PCItem(pcItemObject);
      popupApp.ui.addConversation(pcItem);
    });
  };

  /**
   * Handles error messages
   * @param  {Message} msg - Received Message, describing an error
   *                         (i.e. `.handlers=['error']` and `.payload.code='E*'` )
   */
  let handleErrorMessages = (msg) => {
    // bg/app reports that user isn't logged in
    // (i.e. no auth token found)
    if (msg.payload.code === 'ENOTOKEN') {
      // show login prompt
      popupApp.ui.showLoginUI();
    }
  };

  popupApp.init();

});
