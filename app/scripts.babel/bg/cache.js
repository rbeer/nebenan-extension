
define([
  'bg/cache/nsubset-cache',
  'bg/cache/nstatus-cache',
  'bg/cache/nitem-cache',
  'bg/cache/pcitem-cache',
  'bg/apiclient',
  'bg/storage'
], (NSubsetCache, NStatusCache, NItemCache, PCItemCache, api, storage) => {
  'use strict';
  /**
   * Cache
   * @module bg/cache
   */
  let cache = {
    types: {
      NStatusCache: NStatusCache,
      NItemCache: NItemCache,
      PCItemCache: PCItemCache
    },
    stores: {
      nstatus: null,
      nitem: null,
      pcitem: null
    }
  };

  cache.init = () => {
    let readParsePromises = Object.keys(cache.types).map((cacheKey) => {
      return new Promise((resolve) => resolve(storage.read(cacheKey)));
    });
    return Promise.all(readParsePromises).then(cache.parseFromStorage);
  };

  cache.parseFromStorage = (storeObjs) => {
    devlog('Stored caches:', storeObjs);
    storeObjs = storeObjs.filter((store) => !!store);
    storeObjs.forEach((storeObj) => {
      let storeKey = storeObj.CACHE_TYPE.replace('Cache', '').toLowerCase();
      cache.stores[storeKey] = cache.types[storeObj.CACHE_TYPE].parseFromStorage(storeObj);
    });
  };

  cache.persist = (store) => storage.write(store.CACHE_TYPE, store);

  cache.hasStore = (storeKey) => cache.stores[storeKey] instanceof NSubsetCache;

  cache.cacheSubsets = (dataSets) => {
    let workingSets = dataSets instanceof Array ? dataSets : [ dataSets ];
    let dataType = workingSets[0].SUBSET_TYPE;
    let storeKey = dataType.toLowerCase();

    let addCachingPromise = (dataSet) => {
      return new Promise((resolve) => {
        if (cache.stores[storeKey]) {
          let overflown = cache.stores[storeKey].add(dataSet);
          resolve(overflown.length > 0 ? overflown : null);
        } else {
          cache.stores[storeKey] = new cache.types[dataType + 'Cache'](dataSet, Date.now());
          resolve(null);
        }
      });
    };

    let handleOverflow = (results) => {
      let overflown = results.filter((set) => !!set);
      if (overflown.length > 0) {
        storage.writeSubsets(overflown);
      } else {
        devlog('No overflown sets to write.');
      }
    };

    let cachingPromises = workingSets.map(addCachingPromise);
    return Promise.all(cachingPromises)
                  .then(handleOverflow)
                  .then(() => cache.persist(cache.stores[storeKey]))
                  .then(() => dataSets);
  };

  /**
   * Returns last entry of a cache
   * @param  {String} storeType - Key of *Cache instance in cache.stores
   * @memberOf module:bg/cache
   * @return {APIClient.NSubset}
   */
  cache.getLast = (storeType) => cache.stores[storeType].last;

  /**
   * Returns `n` sets from a cache of `storeType`, beginning at index `start` (including).
   * @param  {String} storeType    - Key of *Cache instance in cache.stores
   * @param  {Number} n=7          - \# of sets to return
   * @param  {Number} start=0      - Index to start return sets at
   * @memberOf module:bg/cache
   * @return {APIClient.NSubset}
   */
  cache.get = (storeType, n, start) => {
    n = !isNaN(n) ? n : 7;
    start = !isNaN(start) ? start : 0;
    return cache.stores[storeType].get(n, start);
  };
  // @ifdef DEV
  let cacheReport = (storeKey) => {
    let store = cache.stores[storeKey];
    let lines = [
      store.CACHE_TYPE,
      `Checking current store with key: ${storeKey}`,
      `  .hasExpired: ${store.hasExpired} -> ${store.hasExpired ? 'Calling API' : ''}`,
      `  .MAX_SIZE: ${store.MAX_SIZE}`,
      `  # dataSets: ${store.dataSets.length}`
    ];
    devlog(lines.join('\n'));
  };
  // @endif
  let queryCacheOrAPI = (...args) => {
    // @ifdef DEV
    cacheReport.apply(null, args);
    // @endif
    let [ storeKey, APIfn, start, n ] = args;
    // request update from API if cache has expired
    if (!cache.stores[storeKey] || cache.stores[storeKey].hasExpired) {
      // translates to
      // APIClient.getStatus(void 0, void 0)
      // APIClient.getNotifications(perPage, lower)
      // APIClient.getNotifications(perPage, page)
      return APIfn(n, start);
    } else {
      let cached = !isNaN(start) && !isNaN(n) ? cache.get(storeKey, start, n) :
                                                cache.getLast(storeKey);
      return Promise.resolve(cached);
    }
  };

  /**
   * Tries to get counter_stats.json ({@link APIClient.NStatus}) data from cache.
   * When cache hasExpired, the API will be queried for possible updates. When such
   * an API call returns updated values, their respective caches will be expired to trigger
   * an update request for them.
   *   - Returning promise resolves with a single NStatus instance, **not* an Array
   * @return {Promise.<APIClient.NStatus, ENOTOKEN>}
   */
  cache.getStatus = () => {
    return queryCacheOrAPI('nstatus', api.getStatus).then((nstatus) => {
      let lastStatus = cache.getLast('nstatus');
      if (nstatus.isDifferentFrom(lastStatus)) {
        devlog('New NStatus has updates, caching...');
        return Promise.resolve(cache.cacheSubsets(nstatus));
      }
      devlog('New NStatus has no updates. Not caching...');
      return nstatus;
    });
  };

  /**
   * Tries to get notifications.json ({@link APIClient.NItem}) data from cache.
   * When cache hasExpired, the API will be queried for possible updates.
   * @param {Number} n=7     - \# of notifications to request
   * @param {Number} lower=0 - Timestamp; query for notifications older than this value
   * @memberOf module:bg/app
   * @return {Promise.<Array.<APIClient.NItem>, ENOTOKEN>}
   */
  cache.getNotifications = (n, lower) => {
    return queryCacheOrAPI('nitem', api.getNotifications, n, lower)
           .then((nitems) => cache.cacheSubsets(nitems));
  };

  /**
   * Tries to get private_conversations.json ({@link APIClient.PCItem}) data from cache.
   * When cache hasExpired, the API will be queried for possible updates.
   * @param {Number} perPage=7     - \# of conversations per request page
   * @param {Number} page=1        - \# of page to request. order of items is DESC date/time
   * @memberOf module:bg/app
   * @return {Promise.<Array.<APIClient.PCItem>, ENOTOKEN>}
   * @example
   * let pageRanges = (perPage) => {
   *   for (let page = 1; page <= 7; page++) {
   *     console.log('Page #' + page);
   *     console.log('First on page:', (page-1)*perPage);
   *     console.log('Last on page:', (page-1)*perPage + (perPage-1));
   *     console.log('-'.repeat(21));
   *   }
   * }
   * pageRanges(15)
   * pageRanges(1)
   * pageRanges(0)
   */
  cache.getConversations = (perPage, page) => {
    return queryCacheOrAPI('pcitem', api.getConversations, perPage, page)
           .then((nitems) => cache.cacheSubsets(nitems));
  };

  return cache;

});
