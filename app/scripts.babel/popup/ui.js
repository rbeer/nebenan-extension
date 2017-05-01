'use strict';

define([
  'popup/custom-elements/status',
  'popup/custom-elements/n-list',
  'popup/ui/clickables',
  'lodash'
], (StatusElement, nlist, clickables, _) => {

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
      slider: null
    },
    nlists: {
      notifications: null,
      conversations: null
    },
    scrollOverlayTimeout: null
  };

  /**
   * I don't know... what could .init be doing? Hmmm...
   * @memberOf module:popup/ui
   */
  ui.init = () => {

    // reference status container element
    // and selection slider
    ui.elements.status = document.getElementById('status');
    ui.elements.slider = ui.elements.status.querySelector('.status-select-slider');

    // reference login prompt overlay elements
    let loginEls = ui.elements.login;
    for (let name in loginEls) {
      loginEls[name] = document.querySelector(`.login-${name}`);
    }

    // reference private_conversation list
    ui.nlists.conversations = document.querySelector('n-list[type="conversations"]');

    // reference notification list
    ui.nlists.notifications = document.querySelector('n-list[type="notifications"]');

    // hook clickable elements
    clickables.init(ui);
    // detect and automatically hook new [aria-role=button][action] elements
    clickables.watch(ui.nlists.notifications);
    clickables.watch(ui.nlists.conversations);

    // add status elements
    let statsEls = ui.elements.stats;
    for (let type in statsEls) {
      statsEls[type] = document.createElement('status-element');
      statsEls[type].populate(type);
      clickables.hook(statsEls[type]);
      ui.elements.status.appendChild(statsEls[type]);
    }

    // hook scroll event to show/hide scrollbar
    let overlay = document.querySelector('.n-list-scrollthumb-overlay');
    ui.nlists.notifications.parentElement.addEventListener('scroll',
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
   * @see module:popup/ui/clickables.handleClicks
   * @see NList.add
   */
  ui.addNotification = (nItem) => {
    ui.nlists.notifications.add(nItem);
  };

  ui.addConversation = (pcItem) => {
    ui.nlists.conversations.add(pcItem);
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
    _.forEach(statsEls, (el, key) => (el.value = values[key]));
  };

  ui.movePanels = (n) => _.forEach(ui.nlists, (nlist) => nlist.setLeft(-n));

  ui.moveSelectSlider = (target) => {
    let sliderStyle = ui.elements.slider.style;
    sliderStyle.width = target.offsetWidth + 'px';
    sliderStyle.left = `${target.offsetLeft - 208}px`;
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
