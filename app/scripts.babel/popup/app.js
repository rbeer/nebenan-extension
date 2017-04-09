'use strict';

define(['messaging', 'popup/ui'], (Messaging, ui) => {

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

    // init UI
    // better safe than sorry mode
    document.addEventListener('DOMContentLoaded', popupApp.ui.init);

    // init Messaging
    popupApp.messaging = new Messaging({
      setStats: popupApp.setStats,                // response for bg/app:getStats
      error: handleErrorMessages
    }, 'popup/app');

    popupApp.messaging.listen();

    // query bgApp for stats
    popupApp.messaging.send('bg/app', ['getStats']);

  };

  popupApp.setStats = (msg) => {
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
