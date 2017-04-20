(() => {
  'use strict';

  /**
   * Selectors for querySelector()
   * @type {Object.<String, String>}
   */
  const selectors = {
    // root Node for feed list
    SECTION: 'section.c-feed_list',
    // actual feed list <ul> Node
    LIST: 'ul.c-feed_list-content',
    // entry <li> Node
    LISTITEM: 'li.c-feed_list-item',
    // Nodes to filter / hide
    UNWANTED: [ '.c-feed_marketplace', 'article.c-feed_marketplace_preview' ]
  };

  /**
   * Filters unwanted entries when <section.c-feed_list> has been populated, initially
   *   - As opposed to e.g. infinite scroll adding new items (see filterOnUlObservation)
   * @param  {Array.<MutationRecord>} mRecords - MutationRecords caught by sectionObserver
   */
  let filterOnSectionObservation = (mRecords) => {

    // <section.c-feed_list> receives <ul.c-feed_list-content> Element, only
    let list = mRecords[0].addedNodes.item(0);
    console.debug('.c-feed_list-content:', list);

    // hide unwanted entries from initial state
    let liNodes = Array.from(list.querySelectorAll(selectors.UNWANTED + ''))
                  .map(findParentLI);
    hideEntries(liNodes);

    // stop observing root Node <section.c-feed_list>
    sectionObserver.disconnect();
    // start observing <ul.c-feed_list-content>
    // for additions e.g. due to infinte scroll
    ulObserver.observe(list, { childList: true });
  };

  /**
   * Catches newly added (to <ul.c-feed_list-content>) items
   * @param  {Array.<MutationRecord>} mRecords - MutationRecords caught by ulObserver
   */
  let filterOnUlObservation = (mRecords) => {
    let liNodes = Array.from(mRecords).map((mRecord) => {

      if (mRecord.addedNodes.length > 0) {
        let addedNode = mRecord.addedNodes.item(0);
        let unwantedContent = addedNode.querySelector(selectors.UNWANTED + '');
        return unwantedContent !== null ? addedNode : null;
      } else {
        return null;
      }
    }).filter((node) => !!node);

    hideEntries(liNodes);
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
    console.debug('hiding:', liNodes);
    liNodes.forEach((node) => node.setAttribute('hidden', ''));
  };

  // react creates the entire <ul.c-feed_list-content> (with its <li> children)
  // and dumps it as one into the DOM; target Element is <section.c-feed_list>,
  // so let that be our observation target, as well. :)
  let sectionTarget = document.querySelector(selectors.SECTION);
  let sectionObserver = new MutationObserver(filterOnSectionObservation);
  sectionObserver.observe(sectionTarget, { childList: true });

  // once <ul.c-feed_list-content> is in the DOM, <li> additions
  // wouldn't be recognized by sectionObserver (unless option { Subtree: true },
  // but that again catches way too much Nodes); so this more narrow observer
  // will take over.
  let ulObserver = new MutationObserver(filterOnUlObservation);

})();
