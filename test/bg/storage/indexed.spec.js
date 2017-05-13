define(['app/scripts/bg/storage/indexed'], (indexedStorage) => {

  let SETUP = {
    testDB: 'na_test',
    storeNames: ['notifications', 'conversations']
  };

  return () => {
    describe('bg/storage/indexed', () => {
      describe('.init', () => {
        let initPromise, writePromise, readPromise, _db;
        it('returns a Promise', () => {
          initPromise = indexedStorage.init(SETUP.testDB);
          expect(initPromise).to.be.instanceof(Promise);
        });
        it('resolves with an open connection to a database...', (done) => {
          initPromise.then((db) => {
            _db = db;
            expect(db).to.be.instanceof(IDBDatabase);
            expect(db.name).to.equal(SETUP.testDB);
            done();
          })
          .catch(done);
        });
        it(`... with objectStores ${SETUP.storeNames}`, () => {
          expect(Array.from(_db.objectStoreNames)).to.have.members(SETUP.storeNames);
        });
      });

      describe('.getObjectStores', () => {
        it('returns an Object.<String, IDBObjectStore>', (done) => {
          let stores = indexedStorage.getObjectStores(SETUP.storeNames);
          expect(stores).to.be.an('object');
          expect(stores).to.have.all.keys(SETUP.storeNames);
          for (let storeName in stores) {
            expect(stores[storeName]).to.be.instanceof(IDBObjectStore);
          }
          done();
        });
      });
    });
  };
});
