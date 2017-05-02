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
   * - Gets references to DOM Elements
   * - Sets hooks on Elements (clicks, etc.)
   * - Sends stats-data request to module:bgApp
   * @memberOf module:popup/app
   */
  popupApp.init = () => {

    // init Messaging
    popupApp.messaging = new Messaging({
      setStats: popupApp.setStats,                 // response for bg/app:getStats
      addNotifications: popupApp.addNotifications, // response for bg/app:getNotifications
      addConversations: popupApp.addConversations, // response for bg/app:getConversations
      error: handleErrorMessages
    }, 'popup/app');

    popupApp.messaging.listen();

    // finish init when DOM is loaded
    document.addEventListener('DOMContentLoaded', initWithDOMLoaded);
  };

  let initWithDOMLoaded = () => {

    // init UI
    popupApp.ui.init().then(() => {
      // query bgApp for stats
      popupApp.messaging.send('bg/app', ['getStats']);
      // query bgApp for notifications
      popupApp.messaging.send('bg/app', ['getNotifications']);
      // query bgApp for private_conversations
      popupApp.messaging.send('bg/app', ['getConversations']);
    }).catch((err) => console.error('popupApp.ui failed!', err));

  };

  popupApp.setStats = (msg) => {
    // TODO: delete users entirely, if f5a642f is kept
    let users = (userCount => {
      // abbreviate user counts > 999 to "1k+", "2k+", so on...
      // (current location of status elements forces "newline" when value is > 3 chars)
      return userCount < 1000 ? userCount : `${Math.floor(userCount / 1000)}k+`;
    })(msg.payload.users);

    // update UI elements
    popupApp.ui.setStats({
      messages: msg.payload.messages || 0,
      notifications: msg.payload.notifications || 0,
      users: users
    });
  };

  popupApp.addNotifications = (msg) => {
    msg.payload.forEach((nItemObject) => {
      let nitem = new NItem(nItemObject);
      devlog(nitem);
      popupApp.ui.addNotification(nitem);
    });
  };

  popupApp.addConversations = (msg) => {
    popupApp.ui.setLoadingDone();
    devlog(msg);
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
