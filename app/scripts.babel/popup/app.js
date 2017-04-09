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
      setStats: popupApp.ui.setStats     // response for bg/app:getStats
    }, 'popup/app');

    popupApp.messaging.listen();

    // query bgApp for stats
    popupApp.messaging.send('bg/app', ['getStats']);

  };

  popupApp.init();

});
