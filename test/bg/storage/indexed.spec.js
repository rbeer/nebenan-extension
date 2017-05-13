define(['app/scripts/bg/storage/indexed'], (indexedStorage) => {

  let SETUP = {
    testDB: 'na_test',
    storeNames: ['notifications', 'conversations'],
    data: {
      noKeyPathWrite: {
        some: 'arbitrary',
        data: false,
        compatible_with: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm'
      },
      write: {
        id: 1,
        some: 'valid',
        data: true
      }
    }
  };

  return () => {

    describe('bg/storage/indexed', () => {

      after(() => {
        let stores = indexedStorage.getObjectStores(SETUP.storeNames);
        for (let storeName in stores) {
          stores[storeName].clear();
        }
      });

      describe('.init', () => {
        let initPromise;
        it('returns a Promise', () => {
          initPromise = indexedStorage.init(SETUP.testDB);
          expect(initPromise).to.be.an.instanceof(Promise);
        });
        let _db;
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

      describe('.write', () => {
        let writePromise;
        it('returns a Promise', () => {
          writePromise = indexedStorage.write('notifications', SETUP.data.write);
          expect(writePromise).to.be.an.instanceof(Promise);
        });
        it('rejects, if `data` doesn\'t provide the keyPath member', (done) => {
          indexedStorage.write('notifications', SETUP.data.noKeyPathWrite)
          .catch((err) => {
            expect(err).to.be.instanceof(DOMException);
            expect(err.name).to.equal('DataError');
            expect(err.code).to.equal(0);
            done();
          });
        });
        it('resolves with key of written data', (done) => {
          writePromise.then((key) => {
            expect(key).to.equal(SETUP.data.write[indexedStorage.getObjectStore('notifications').keyPath]);
            done();
          });
        });
        it('rejects, if key is already in store', (done) => {
          indexedStorage.write('notifications', SETUP.data.write).catch((err) => {
            expect(err).to.be.instanceof(DOMException);
            expect(err.name).to.equal('ConstraintError');
            expect(err.code).to.equal(0);
            done();
          });
        });
      });

      describe('.read', () => {
        let readPromise;
        it('returns a Promise', () => {
          readPromise = indexedStorage.read('notifications', SETUP.data.write.id);
          expect(readPromise).to.be.an.instanceof(Promise);
        });
        it('resolves with data for provided key', (done) => {
          readPromise.then((data) => {
            expect(data).to.eql(SETUP.data.write);
            done();
          });
        });
      });

    });
  };
});
