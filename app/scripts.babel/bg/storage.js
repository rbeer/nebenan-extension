define([
  'lodash'
], (_) => {
  'use strict';

  /**
   * Chrome Storage API wrapper
   * @module bg/storage
   */
  let storage = {};

  // read('stores')
  storage.read = (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (stored) => {
        devlog('stored type:', typeof stored);
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(stored[key]);
      });
    });
  };

  // write('stores', cache.stores)
  storage.write = (key, data) => {
    return new Promise((resolve, reject) => {
      let storing = { [key]: data };
      chrome.storage.local.set(storing, () => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
      });
    });
  };

  storage.update = (key, data) => {
    return storage.read(key).then((stored) => {
      let typeofData = typeof data;
      let typeofStored = typeof stored;
      let updated;

      switch(true) {
        case typeofData !== typeofStored && typeofStored !== 'undefined':
          throw new TypeError(`Type of update data (${typeofData})
            doesn\'t match stored data ${typeofStored}`);
        case data instanceof Array:
          updated = data.concat(stored);
          break;
        case typeofData === 'object':
          updated = stored;
          _.assign(updated, data);
          break;
        default:
          updated = data;
          break;
      }
      return storage.write(key, updated);
    });
  };

  storage.writeSubsets = (dataSets) => {
    let storingSets = dataSets instanceof Array ? dataSets : [ dataSets ];
    // @if DEV=true
    storingSets = storingSets.map((dataSet) => {
      if (Object.keys(dataSet).includes('_raw')) {
        delete dataSet['_raw'];
      }
      return dataSet;
    });
    // @endif
    let type = storingSets[0].SUBSET_TYPE;
    return storage.update(type, storingSets).then(() => dataSets);
  };

  return storage;
});
