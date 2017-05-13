define([
  'dist/scripts/bg/dev',
  'dist/scripts/bg/livereload',
  'test/bg/storage/indexed.spec'
], (dev, livereload, idbSpec) => {
  window.devlog = dev.log;
  livereload.connect();
  let chai = require('node_modules/chai/chai');
  window.expect = chai.expect;
  mocha.setup('bdd');
  idbSpec();
  mocha.run();
});
