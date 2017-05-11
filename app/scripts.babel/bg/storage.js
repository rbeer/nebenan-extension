define([
  'bg/storage/chrome',
  'lodash'
], (chromeStorage, _) => {
  'use strict';

  /**
   * Chrome Storage API wrapper
   * @module bg/storage
   */
  let storage = {
    local: chromeStorage
  };

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
    let type = storingSets[0].SUBSET_TYPE;
    return storage.local.update(type, storingSets).then(() => dataSets);
  };

  return storage;
});
