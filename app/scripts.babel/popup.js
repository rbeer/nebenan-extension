'use strict';

(() => {

  /**
   * PopUP main app
   * @module popupApp
   */
  let popupApp = window.popupApp = {
    elements: {
      stats: {
        users: null,
        messages: null,
        notifications: null
      }
    }
  };

  /**
   * Initializes main app
   * - Gets references to DOM Elements
   * - Sets hooks on Elements (clicks, etc.)
   * - Sends stats-data request to module:bgApp
   * @memberOf module:popupApp
   */
  popupApp.init = () => {

    // logo click event
    document.querySelector('.logo').addEventListener('click', popupApp.clickLogo);

    let statsEls = popupApp.elements.stats;
    for (let name in statsEls) {
      statsEls[name] = document.querySelector(`.status-${name} span`);
    }

    // Ask bgApp for status values
    // ------------------------------
    // The response will be of type "error" with solution "showLoginUI",
    // even when cached values are available.
    chrome.runtime.sendMessage({
      from: 'popupApp',
      to: 'bgApp',
      type: 'stats'
    }, (res) => {
      if (!res) {
        return console.error(chrome.runtime.lastError);
      }
      if (res.type === 'error') {
        return popupApp[res.solution]();
      }
      let stats = res.stats;
      let statsEls = popupApp.elements.stats;

      statsEls.notifications.textContent = stats.notifications;
      statsEls.messages.textContent = stats.messages;
      statsEls.users.textContent = (userCount => {
        // abbreviate user counts > 999 to "1k+", "2k+", so on...
        // (current location of status elements forces "newline" when value is > 3 chars)
        return userCount < 1000 ? userCount : `${Math.floor(userCount / 1000)}k+`;
      })(stats.users);
    });

  };

  /**
   * Handler for logo click
   * - Opens new tab for https://nebenan.de/
   * @param  {MouseEvent} evt
   * @memberOf module:popupApp
   */
  popupApp.clickLogo = (evt) => {
    chrome.tabs.create({
      url: 'https://nebenan.de/',
      active: true
    });
  };

  /**
   * Handler for "logged out"-errors.
   * - Prompts user to log in (link to /login)
   * - Setting the token cookie from within the extension doesn't seem to work.
   *   At least not if we want to share the cookie with the site. Cookie's domain from
   *   within the extension would be ".nebenan.de" instead of "nebenan.de".
   * @memberOf module:popupApp
   */
  popupApp.showLoginUI = () => {
    console.log('Showing login UI');
  };

  // better safe than sorry ;D
  document.addEventListener('DOMContentLoaded', popupApp.init);

})();
