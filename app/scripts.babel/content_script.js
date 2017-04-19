(() => {
  'use strict';

  /**
   * Selectors for querySelector()
   * @type {Object.<String, String>}
   */
  const selectors = {
    // root Node for feed list
    LIST: 'section.c-feed_list',
    // actual feed list Node
    LISTITEM: 'ul.c-feed_list-item',
    // Nodes to filter / hide
    UNWANTED: [ '.c-feed_marketplace', 'article.c-feed_marketplace_preview' ]
  };

  /**
   * Filters unwanted entries when <section.c-feed_list> has been populated, initially
   *   - As opposed to e.g. infinite scroll adding new items
   * @param  {Array.<MutationRecord>} mRecords - MutationRecords caught by initObserver
   */
  let filterOnInitObservation = (mRecords) => {

    // <section.c-feed_list> receives <ul.c-feed_list-content> Element, only
    let list = mRecords[0].addedNodes.item(0);
    console.debug('.c-feed_list-content:', list);

    // hide unwanted entries from initial state
    let liNodes = Array.from(list.querySelectorAll(selectors.UNWANTED + '')).map(findParentLI);
    hideEntries(liNodes);

    // stop observing root Node <section.c-feed_list>
    initObserver.disconnect();
  };

  /**
   * Finds parent list item (<li>) to matched entries
   *   - think JQuery's .parent() !
   * @param  {Node} node - Child Node to start searching upwards from
   * @return {Node}
   */
  let findParentLI = (node) => {
    let parent = node.parentNode;
    let liClass = selectors.LISTITEM.slice(3);

    while (parent.className !== liClass) {
      parent = parent.parentNode;
    }

    return parent;
  };

  /**
   * Adds 'hidden' attribute to every Node in an Array
   *   - using site's CSS rule [hidden] { display:none }
   * @param  {Array.<Node>} liNodes - Nodes to hide
   */
  let hideEntries = (liNodes) => {
    liNodes.forEach((node) => node.setAttribute('hidden', ''));
  };

  // react creates the entire <ul.c-feed_list-content> (with its <li> children)
  // and dumps it as one into the DOM; target Element is <section.c-feed_list>,
  // so let that be our observation target, as well. :)
  let initTarget = document.querySelector(selectors.LIST);
  let initObserver = new MutationObserver(filterOnInitObservation);
  initObserver.observe(initTarget, { childList: true });

})();
