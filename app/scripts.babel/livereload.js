'use strict';

define(() => {
  const LIVERELOAD_HOST = 'localhost:';
  const LIVERELOAD_PORT = 35729;
  const connection = new WebSocket('ws://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload');

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

  return connection;

});
