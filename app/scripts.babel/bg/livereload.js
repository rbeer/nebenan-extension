'use strict';

define(() => {
  let livereload;
  // @ifdef DEV
  livereload = {
    host: 'localhost',
    port: 35729,
    connection: null
  };

  livereload.connect = (port, host) => {
    if (typeof port === 'string') {
      livereload.host = port;
    } else {
      livereload.host = host || livereload.host;
      livereload.port = port || livereload.port;
    }

    let wsck = livereload.connection = new WebSocket(`ws://${livereload.host}:${livereload.port}/livereload`);
    wsck.onerror = evt => devlog('Reload connection got error:', evt);
    wsck.onmessage = evt => {
      devlog(evt);
      if (evt.data) {
        const data = JSON.parse(evt.data);
        if (data && data.command === 'reload') {
          switch (data.path) {
            case 'app':
              chrome.runtime.reload();
              break;
            case 'tests':
              location.reload();
              break;
            default:
              console.warn('Unknown livereload command received:', data);
          }
        }
      }
    };
  };
  // @endif

  return livereload;

});
