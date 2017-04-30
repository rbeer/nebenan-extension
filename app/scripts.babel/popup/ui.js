'use strict';

define(['popup/components/status', 'popup/components/n-list'], (StatusElement, nlist) => {

  /**
   * Popup DOM interaction
   * @module popup/ui
   */
  let ui = {
    elements: {
      stats: {
        notifications: null,
        messages: null,
        users: null
      },
      login: {
        blur: null,
        overlay: null,
        prompt: null
      },
      status: null,
      nlist: null
    },
    scrollOverlayTimeout: null
  };

  /**
   * I don't know... what could .init be doing? Hmmm...
   * @memberOf module:popup/ui
   */
  ui.init = () => {
    // hook clickable elements
    let clickables = document.querySelectorAll('[aria-role="button"][action]');
    for (let element of clickables) {
      element.addEventListener('click', ui.handleClicks);
    }

    // reference status container element
    ui.elements.status = document.getElementById('status');

    // add status elements
    let statsEls = ui.elements.stats;
    for (let type in statsEls) {
      statsEls[type] = document.createElement('status-element');
      statsEls[type].populate(type);
      ui.elements.status.appendChild(statsEls[type]);
    }

    // reference login prompt overlay elements
    let loginEls = ui.elements.login;
    for (let name in loginEls) {
      loginEls[name] = document.querySelector(`.login-${name}`);
    }

    // reference notification list
    ui.elements.nlist = document.getElementById('n-list');

    // hook scroll event to show/hide scrollbar
    let overlay = document.querySelector('.n-list-scrollthumb-overlay');
    ui.elements.nlist.parentElement.addEventListener('scroll',
                                            ui.showScrollbar.bind(null, overlay));
  };

  ui.showScrollbar = (overlay, evt) => {
    overlay.classList.add('scrolling');
    ui.scrollOverlayTimeout = window.setTimeout(() => {
      overlay.classList.remove('scrolling');
    }, 750);
  };

  /**
   * Adds a new n-listitem to the n-list
   *   - Hooks the link of that new n-listitem
   * @param  {APIClient.NItem|NListItem} nItem - Either an APIClient.NItem to build an
   *                                             NListeItem from; or a fully prepared,
   *                                             as in .populate called, NListItem.
   * @memberOf module:popup/ui
   * @see module:popup/ui.handleClicks
   * @see NList.add
   */
  ui.addNotification = (nItem) => {
    ui.elements.nlist.add(nItem).hookLink(ui.handleClicks);
  };

  /**
   * Sets status counter values
   * @param {!Object} values
   * @param {!String} values.notifications - \# of notifications
   * @param {!String} values.messages      - \# of new messages
   * @param {!String} values.users         - \# of hood users (kinda YAGNI)
   * @memberOf module:popup/ui
   */
  ui.setStats = (values) => {
    let statsEls = ui.elements.stats;

    statsEls.notifications.value = values.notifications;
    statsEls.messages.value = values.messages;
    statsEls.users.value = values.users;
  };

  /**
   * Handler for DOM clicks (<* aria-role="button" action="action.value">)
   * - newtab - Creates a new tab.
   *            The value can be either a path relative to https://nebenan.de/
   *            (e.g. newtab.feed -> https://nebenan.de/feed) or an absolute
   *            (starting with `https`!) one
   * @param {?String}     actionValue - First parameter is the `action.value` String, when called explicitly by an NListItem
   * @param {!MouseEvent} evt         - First parameter is a MousrEvent, when hooked by module:popup/ui.init; second otherwise
   * @memberOf module:popup/ui
   * @returns {Bool} `false`
   * @see NListItem#hookLink
   */
  ui.handleClicks = (...args) => {

    let evt;
    let action;
    let value;
    let splitActionValue = (str) => {
      let matches = str.match(/(\w+)\.(.*)/);
      return [ matches[1], matches[2] ];
    };

    if (args.length === 1) {
      // event mode - args[0] is the MouseEvent
      evt = args[0];
      [ action, value ] = splitActionValue(evt.target.getAttribute('action'));
    } else {
      // explicit mode - args[1] is the MouseEvent
      evt = args[1];
      [ action, value ] = splitActionValue(args[0]);
    }

    evt.preventDefault();

    if (action === 'newtab') {
      chrome.tabs.create({
        url: (value.startsWith('https') ? value : 'https://nebenan.de/' + value),
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
