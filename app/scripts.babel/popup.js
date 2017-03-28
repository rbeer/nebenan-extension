'use strict';

(() => {

  let pupApp = window.popupApp = {
    elements: {
      stats: {
        users: null,
        messages: null,
        notifications: null
      }
    }
  };

  pupApp.init = () => {

    // logo click event
    document.querySelector('.logo').addEventListener('click', pupApp.clickLogo);

    let statsEls = pupApp.elements.stats;
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
        return pupApp[res.solution]();
      }
      let stats = res.stats;
      let statsEls = pupApp.elements.stats;

      statsEls.notifications.textContent = stats.notifications;
      statsEls.messages.textContent = stats.messages;
      statsEls.users.textContent = (userCount => {
        // abbreviate user counts > 999 to "1k+", "2k+", so on...
        // (current location of status elements forces "newline" when value is > 3 chars)
        return userCount < 1000 ? userCount : `${Math.floor(userCount / 1000)}k+`;
      })(stats.users);
    });

  };

  // logo click event handler
  pupApp.clickLogo = (evt) => {
    chrome.tabs.create({
      url: 'https://nebenan.de/',
      active: true
    });
  };

  pupApp.showLoginUI = () => {
    console.log('Showing login UI');
  };

  document.addEventListener('DOMContentLoaded', pupApp.init);

})();
