'use strict';

define(() => {
  let livereload;
  // @ifdef DEV
  livereload = {
    test: {
      host: 'localhost',
      port: 35730,
      connection: null
    },
    debug: {
      host: 'localhost',
      port: 35729,
      connection: null
    }
  };

  livereload.connect = (portOrAlias, host) => {
    let wsckHost = '';
    let wsckPort = 0;
    let reloadFn = chrome.runtime.reload;
    if (typeof portOrAlias === 'string') {
      let { host, port } = livereload[portOrAlias];
      wsckHost = host;
      wsckPort = port;
      if (portOrAlias === 'test') {
        reloadFn = location.reload;
      }
    } else {
      wsckHost = host = host || livereload.debug.host;
      wsckPort = portOrAlias || livereload.debug.port;
    }

    let wsck = livereload.connection = new WebSocket(`ws://${wsckHost}:${wsckPort}/livereload`);
    wsck.onerror = evt => devlog('Reload connection got error:', evt);
    wsck.onmessage = evt => {
      devlog(evt);
      if (evt.data) {
        const data = JSON.parse(evt.data);
        if (data && data.command === 'reload') {
          reloadFn();
        }
      }
    };
  };
  // @endif

  return livereload;

});
