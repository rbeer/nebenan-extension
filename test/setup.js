define([
  'dist/scripts/bg/dev',
  'dist/scripts/bg/livereload',
  'test/bg/storage/indexed.spec'
], (dev, livereload, idbSpec) => {
  window.devlog = dev.log;
  livereload.connect('test');
  livereload.onmessage = evt => {
    if (evt.data) {
      const data = JSON.parse(evt.data);
      if (data && data.command === 'reload') {
        location.reload();
      }
    }
  };
  let chai = require('node_modules/chai/chai');
  window.expect = chai.expect;
  mocha.setup('bdd');
  idbSpec();
  mocha.run();
});
