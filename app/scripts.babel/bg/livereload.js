'use strict';

define(() => {
  let connection = null;
  // @ifdef DEV
  const LIVERELOAD_HOST = 'localhost:';
  const LIVERELOAD_PORT = 35729;
  connection = new WebSocket('ws://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload');

  connection.onerror = err => devlog('Reload connection got error:', err);

  connection.onmessage = evt => {
    devlog(evt);
    if (evt.data) {
      const data = JSON.parse(evt.data);
      if (data && data.command === 'reload') {
        chrome.runtime.reload();
      }
    }
  };
  // @endif

  return connection;

});
