'use strict';

define(['popup/n-list'], (nlist) => {

  /**
   * Popup DOM interaction
   * @module popup/ui
   */
  let ui = {
    elements: {
      stats: {
        users: null,
        messages: null,
        notifications: null
      },
      login: {
        blur: null,
        overlay: null,
        prompt: null
      },
      nlist: null
    }
  };

  ui.init = () => {
    // hook clickable elements
    let clickables = document.querySelectorAll('[aria-role="button"][action]');
    for (let element of clickables) {
      element.addEventListener('click', ui.handleClicks);
    }

    // reference status elements
    let statsEls = ui.elements.stats;
    for (let name in statsEls) {
      statsEls[name] = document.querySelector(`.status-${name} span`);
    }

    // reference login prompt overlay elements
    let loginEls = ui.elements.login;
    for (let name in loginEls) {
      loginEls[name] = document.querySelector(`.login-${name}`);
    }

    // reference notification list
    ui.nlist = document.getElementById('n-list');
  };

  ui.addNotification = (nItem) => {
    ui.nlist.add(nItem);
  };

  /**
   * Sets status counter values
   * @param {!Object} values
   * @param {!String} values.notifications - # of notifications
   * @param {!String} values.messages      - # of new messages
   * @param {!String} values.users         - # of hood users (kinda YAGNI)
   */
  ui.setStats = (values) => {
    let statsEls = ui.elements.stats;

    statsEls.notifications.textContent = values.notifications;
    statsEls.messages.textContent = values.messages;
    statsEls.users.textContent = values.users;
  };

  /**
   * Handler for DOM clicks (<* aria-role="button" action="action.value">)
   * - newtab - Creates a new tab. The value is a path relative to https://nebenan.de/ (e.g. newtab.feed -> https://nebenan.de/feed)
   * @param  {MouseEvent} evt
   * @memberOf module:popup/ui
   */
  ui.handleClicks = (evt) => {
    evt.preventDefault();

    let [ action, value ] = evt.target.getAttribute('action').split('.');

    if (action === 'newtab') {
      chrome.tabs.create({
        url: 'https://nebenan.de/' + value,
        active: true
      });
    }

    return false;
  };

  /**
   * Handler for ENOTOKEN-errors.
   * - Prompts user to log in (link to /login)
   * - Setting the token cookie from within the extension doesn't seem to work.
   *   At least not if we want to share the cookie with the site. Cookie's domain from
   *   within the extension would be ".nebenan.de" instead of "nebenan.de".
   * @memberOf module:popup/ui
   */
  ui.showLoginUI = () => {
    let elements = ui.elements.login;
    elements.blur.setAttribute('blur', true);
    elements.overlay.classList.remove('hidden');
    elements.prompt.classList.remove('hidden');
  };

  return ui;

});
