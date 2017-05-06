define(() => {
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
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        devlog('GOT:', stored[key]);
        resolve(stored[key]);
      });
    });
  };

  // write('stores', cache.stores)
  storage.write = (key, data) => {
    return new Promise((resolve, reject) => {
      let storing = { [key]: data };
      chrome.storage.local.set(storing, () => {
        devlog('STORED:', data);
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
      });
    });
  };

  return storage;
});
