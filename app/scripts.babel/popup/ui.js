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
      status: {
        notifications: null,
        conversations: null
      },
      login: {
        blur: null,
        overlay: null,
        prompt: null
      },
      statusContainer: null,
      slider: null,
      loading: null
    },
    nlists: {
      notifications: null,
      conversations: null
    },
    scrollOverlayTimeout: null
  };

  /**
   * I don't know... what could .init be doing? Hmmm...
   * @param {module:bgApp} _app
   * @return {Promise} For flow control, only
   * @see module:popup/app.init
   * @memberOf module:popup/ui
   */
  ui.init = (_app) => {

    return new Promise((resolve) => {
      // reference loading animation / background
      ui.elements.loading = document.getElementById('loading');
      // reference statusContainer container element
      ui.elements.statusContainer = document.getElementById('status');
      // add status elements
      for (let type in ui.elements.status) {
        let element = ui.elements.status[type] = document.createElement('status-element');
        element.populate(type);
        ui.elements.statusContainer.appendChild(element);
      }

      // reference selection slider element
      ui.elements.slider = ui.elements.statusContainer
                                      .querySelector('.status-select-slider');
      // init position and size
      ui.moveSelectSlider(ui.elements.statusContainer.querySelector('status-element'));

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
      clickables.init(_app);
      // detect and automatically hook new [aria-role=button][action] elements
      clickables.watch(ui.nlists.notifications);
      clickables.watch(ui.nlists.conversations);

      // hook scroll event to show/hide scrollbar
      let overlay = document.querySelector('.n-list-scrollthumb-overlay');
      ui.nlists.notifications.parentElement.addEventListener('scroll',
        ui.showScrollbar.bind(null, overlay));

      resolve();
    });
  };

  ui.showScrollbar = (overlay, evt) => {
    overlay.classList.add('scrolling');
    ui.scrollOverlayTimeout = window.setTimeout(() => {
      overlay.classList.remove('scrolling');
    }, 750);
  };

  /**
   * Adds a new n-listitem to the n-list
   * @param  {APIClient.NItem|NListItem} nItem - Either an APIClient.NItem to build an
   *                                             NListeItem from | a fully prepared,
   *                                             as in .populate called, NListItem
   * @return {NListItem} Added NListItem
   * @memberOf module:popup/ui
   * @see NList.add
   */
  ui.addNotification = (nItem, atTop) => ui.nlists.notifications.add(nItem, atTop);

  /**
   * Adds a new n-listitem to the n-list
   * @param  {APIClient.PCItem|PCListItem} pcItem - Either an APIClient.PCItem to build an
   *                                                PCListeItem from | a fully prepared,
   *                                                as in .populate called, PCListItem
   * @return {PCListItem} Added PCListItem
   * @memberOf module:popup/ui
   * @see NList.add
   */
  ui.addConversation = (pcItem) => ui.nlists.conversations.add(pcItem);

  /**
   * Sets status counter values
   * @param {!Object}  values
   * @param {!String}  values.notifications - \# of notifications
   * @param {!String}  values.conversations - \# of new conversations
   * @param {?Boolean} update               - Treat values as addends, rather than absolute values
   *                                          and toggles updates-item in nlist
   * @memberOf module:popup/ui
   */
  ui.setStatus = (values, update) => {
    let statusElements = ui.elements.status;
    _.forEach(statusElements, (statusElement, key) => {
      statusElement.value = update ? (statusElement.value += values[key]) : values[key];
      if (update && statusElement.value > 0) {
        ui.toggleUpdatesItem(key, values[key], true);
      }
    });
  };

  ui.toggleUpdatesItem = (type, n, show) => {
    let element = document.querySelector('n-list[type="' + type + '"] .updates-item');
    show = show !== void 0 ? show : !element.hasAttribute('active');
    element.setAttribute('n', n);
    show ? element.setAttribute('active', '') : element.removeAttribute('active');
  };

  ui.movePanels = (n) => _.forEach(ui.nlists, (nlist) => nlist.setLeft(-n));

  ui.moveSelectSlider = (target) => {
    let sliderStyle = ui.elements.slider.style;
    let firstLeft = target.parentElement.querySelector('status-element').offsetLeft;
    sliderStyle.width = target.offsetWidth + 'px';
    sliderStyle.left = `${target.offsetLeft - firstLeft}px`;
  };

  ui.setLoadingDone = () => {
    return new Promise((resolve) => {
      if (ui.elements.loading.hasAttribute('done')) {
        return resolve();
      }
      ui.elements.loading.addEventListener('transitionend', resolve);
      ui.elements.loading.setAttribute('done', '');
    });
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
