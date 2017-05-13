define(() => {

  // notifications
  // keyPath = id
  //
  // conversations
  // keypath = partner.id

  let indexedStorage = {
    db: null,
    _V: 1     // DB version
  };

  let _db;

  indexedStorage.init = (dbName) => {
    dbName = dbName || 'nebenan';
    return new Promise((resolve, reject) => {
      // DBOpenRequest
      let openRequest = indexedDB.open(dbName, indexedStorage._V);
      openRequest.onerror = onError.bind(openRequest, reject);
      openRequest.onupgradeneeded = onUpgradeNeeded.bind(openRequest);
      openRequest.onsuccess = onOpenSuccess.bind(openRequest, resolve);
    });
  };

  indexedStorage.getObjectStores = (names) => {
    names = names instanceof Array ? names : [ names ];
    let transaction = _db.transaction(names, 'readwrite');
    let stores = names.reduce((acc, name) => {
      acc[name] = transaction.objectStore(name);
      return acc;
    }, {});
    return stores;
  };
  indexedStorage.getObjectStore = (name) => indexedStorage.getObjectStores(name)[name];

  indexedStorage.write = (storeName, data) =>
    promiseRequest(indexedStorage.getObjectStore(storeName), data);

  indexedStorage.read = (storeName, key) =>
    promiseRequest(indexedStorage.getObjectStore(storeName), key);

  let promiseRequest = (objectStore, data) => {
    return new Promise((resolve, reject) => {
      let request = typeof data === 'object' ? objectStore.add(data) : objectStore.get(data);
      request.onsuccess = (evt) => {
        resolve(evt.target.result);
      };
      request.onerror = (evt) => {
        reject(evt.target.error);
      };
    });
  };

  let onUpgradeNeeded = function onUpgradeNeeded(evt) {
    devlog(evt);
    setDB(this.result);
    switch (true) {
      case evt.oldVersion === 0 && evt.newVersion === 1:
        _db.createObjectStore('notifications', { keyPath: 'id' });
        _db.createObjectStore('conversations', { keyPath: 'partner_id' });
        break;
    }
  };

  let setDB = (db) => {
    _db = indexedStorage.db = _db || db;
    return _db;
  };

  let onError = (reject, evt) => {
    devlog(evt.target.error);
    reject(evt.target.error);
  };

  let onOpenSuccess = function onOpenSuccess(resolve, evt) {
    devlog(evt);
    resolve(setDB(this.result));
  };

  let onVersionChange = (evt) => {
    devlog(evt);
  };

  return indexedStorage;

});
