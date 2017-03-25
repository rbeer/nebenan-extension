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

    // ask bgApp for status values
    chrome.runtime.sendMessage({
      from: 'popupApp',
      to: 'bgApp',
      type: 'counter_stats'
    }, (res) => {
      if (res.type === 'error') {
        return pupApp[res.solution]();
      }
      let stats = res.counter_stats;
      let statsEls = pupApp.elements.stats;

      statsEls.notifications.textContent = stats.notifications;
      statsEls.messages.textContent = stats.messages;
      statsEls.users.textContent = (userCount => {
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
