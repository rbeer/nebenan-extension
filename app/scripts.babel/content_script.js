'use strict';

(() => {

  const targetClasses = {
    LIST: 'c-feed_list-content',
    MARKET: '.c-feed_marketplace',
    MARKET_PREVIEW: 'article.c-feed_marketplace_preview'
  };

  let filterEntries = (mutations) => {
    mutations.forEach((mRecord) => {

      if (mRecord.target.className === targetClasses.LIST) {
        console.debug('found list:', mRecord.target);

        // remove marketplace entries (will most likely produce flicker)
        Array.from(mRecord.target.children).forEach((li) => {
          if (li.querySelector(targetClasses.MARKET) ||
              li.querySelector(targetClasses.MARKET_PREVIEW)) {
            console.debug('removing:', li);
            li.remove();
          }
        });
      }
    });
  };

  // react seems to create a #document and dump it
  // as one into the DOM; so the observation needs to apply to the
  // <body>, as the target <ul> isn't available
  let ulObserver = new MutationObserver(filterEntries);
  ulObserver.observe(document.body, { childList: true, subtree: true });

  //
  window.onpopstate = () => {
    console.debug('records:', ulObserver.takeRecords());
  };


})();
