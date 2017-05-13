define([
  'bg/storage/chrome',
  'bg/storage/indexed',
  'lodash'
], (chromeStorage, indexedStorage, _) => {
  'use strict';

  /**
   * Chrome Storage API wrapper
   * @module bg/storage
   */
  let storage = {
    local: chromeStorage,
    indexed: indexedStorage
  };

  window['idxed'] = storage.indexed;

  storage.writeSubsets = (dataSets) => {
    let storingSets = dataSets instanceof Array ? dataSets : [ dataSets ];
    // @ifdef DEV
    storingSets = storingSets.map((dataSet) => {
      if (Object.keys(dataSet).includes('_raw')) {
        delete dataSet['_raw'];
      }
      return dataSet;
    });
    // @endif
    //let type = storingSets[0].SUBSET_TYPE;
    //return storage.local.update(type, storingSets).then(() => dataSets);
    return dataSets;
  };

  return storage;
});
