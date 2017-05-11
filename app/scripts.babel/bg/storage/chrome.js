define([
  'lodash'
], (_) => {

  let chromeStorage = {};

  chromeStorage.read = (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (stored) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(stored[key]);
      });
    });
  };

  // write('stores', cache.stores)
  chromeStorage.write = (key, data) => {
    return new Promise((resolve, reject) => {
      let storing = { [key]: data };
      chrome.storage.local.set(storing, () => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
      });
    });
  };

  chromeStorage.update = (key, data) => {
    return chromeStorage.read(key).then((stored) => {
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
      return chromeStorage.write(key, updated);
    });
  };

  return chromeStorage;
});
