define(() => {
  'use strict';

  let _app;

  /**
   * Manages clickable elements
   * @module popup/ui/clickables
   */
  let clickables = { observers: [] };

  /**
   * Gets all `[aria-role="button"][action]` elements currently in
   * the DOM and hooks them.
   * @param  {module:popup/app} parentApp
   * @memberOf module:popup/ui/clikables
   */
  clickables.init = (parentApp) => {
    _app = parentApp;
    let elements = document.querySelectorAll('[aria-role="button"][action]');
    clickables.hook(Array.from(elements));
  };

  /**
   * Adds EventListener module:popup/ui/clickables.handleClicks
   * to given `element`
   * @param  {HTMLElement|Array.<HTMLElement>} elements
   */
  clickables.hook = (elements) => {
    if (elements instanceof HTMLElement) {
      elements = [elements];
    } else if (!(elements instanceof Array)) {
      throw new TypeError('First parameter must be an (Array of) HTMLElement.');
    }

    for (let element of elements) {
      let _role = element.getAttribute('aria-role');
      let _hasAction = element.hasAttribute('action');
      if (_role === 'button' && _hasAction) {
        element.addEventListener('click', clickables.handleClicks);
      } else {
        console.warn('This isn\'t a `clickables` element:', element);
      }
    }
  };

  /**
   * Creates a MutationObserver on input `element`, watching for
   * clickable elements, hooking found ones. Returns an id for use
   * with stop(id)
   * @param  {HTMLElement} element - Any HTMLElement that is expected to have clickable elements inserted
   * @return {Number} MutationObserver ID, used for stop(id)
   */
  clickables.watch = (element) => {
    let observer = new MutationObserver(parseMutations);
    observer.observe(element, { childList: true });
    clickables.observers.push(observer);
    return clickables.observers.length - 1;
  };

  let parseMutations = (mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length < 1) {
        return;
      }
      let elements = mutation.addedNodes.item(0)
                     .querySelectorAll('[aria-role="button"][action]');
      if (elements) {
        clickables.hook(Array.from(elements));
      }
    });
  };

  /**
   * Stops and destroys the MutationObserver with given `id`,
   * @param  {Number} id - MutationObserver id, as returned by watch(element)
   */
  clickables.stop = (id) => {
    clickables.observers[id].disconnect();
    clickables.observers[id] = null;
  };

  /**
   * Handler for DOM clicks (<* aria-role="button" action="action.value">)
   * - newtab - Creates a new tab.
   *            The value can be either a path relative to https://nebenan.de/
   *            (e.g. newtab.feed -> https://nebenan.de/feed) or an absolute
   *            (starting with `https`!) one
   * @param {?String}     actionValue - First parameter is the `action.value` String, when called explicitly by an NListItem
   * @param {!MouseEvent} evt         - First parameter is a MousrEvent, when hooked by module:popup/ui.init; second otherwise
   * @memberOf module:popup/ui/clickables
   * @returns {Bool} `false`
   * @see NListItem#hookLink
   */
  clickables.handleClicks = (...args) => {

    let evt;
    let action;
    let value;
    let splitActionValue = (str) => {
      let matches = str.match(/([\w\-]+)\.(.*)/);
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

    switch (action) {
      case 'newtab':
        chrome.tabs.create({
          url: (value.startsWith('https') ? value : 'https://nebenan.de/' + value),
          active: true
        });
        break;
      case 'select-panel':
        _app.ui.moveSelectSlider(evt.target);
        _app.ui.movePanels(evt.target.type === 'notifications' ? 0 : 350);
        break;
      case 'dismiss':
        let [ tag, id ] = value.split(':');
        document.querySelector(`${tag}[id="${id}"]`).dismiss();
        break;
      case 'update':
        let upperCaseType = value.slice(0, 1).toUpperCase() + value.slice(1);
        let n = evt.target.getAttribute('n') || 0;
        _app.messaging.send('bg/app', ['get' + upperCaseType], { type: 'update', n: n });
        evt.target.removeAttribute('active');
        _app.ui.elements.stats[value].active = false;
        break;
      default:
        console.warn('Unknown click action:', action);
        console.info('Arguments:', args);
    }

    return false;
  };

  return clickables;
});
