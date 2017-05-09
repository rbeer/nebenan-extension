/* eslint-disable semi */
define([
  'bg/alarms',
  'bg/apiclient',
  'bg/auth',
  'bg/livereload',
  'bg/cache',
  'messaging',
  'lodash'
], (Alarms, APIClient, auth, lreload, cache, Messaging, _) => {
  'use strict';
  /**
   * Background Main App
   * @module bg/app
   */
  let bgApp = {
    api: APIClient,
    auth: auth,
    cache: cache,
    alarms: null, // -> .init()
    messaging: null // -> .init()
  };

  /**
   * DEV/Debug mode augmentations
   * Use `$ gulp dev` to activate
   */

  // noop when not in dev mode
  window.devlog = () => void 0;

  // @ifdef DEV
  // included in .rjs-dev
  let awaitDevInit = () => new Promise((resolve) => {
    let devLoaded = () => {
      if (bgApp.dev) {
        window.clearInterval(interval);
        resolve(bgApp);
      }
    };
    let interval = window.setInterval(devLoaded, 5);
  });

  require(['bg/dev'], (dev) => {
    bgApp.dev = dev;
  });
  // @endif

  /**
   * Initializes module:bg/app
   * - Starts Alarm for stats
   * - Listens to runtime messages
   * @memberOf module:bg/app
   */
  bgApp.init = () => {
    devlog('onStartup');
    // set browserAction badge color
    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });

    // init Messaging
    bgApp.messaging = new Messaging({
      getStatus: (msg, respond) => {
        cache.getStatus()
        .then((status) => {
          let response = msg.cloneForAnswer(['setStatus'], status);
          respond(response);
        })
        .catch((err) => {
          let response = msg.cloneForAnswer(['error'], err);
          respond(response);
        });
      },
      getNotifications: (msg, respond) => {
        let params = _.assign({ n: 7, lower: 0 }, msg.payload);
        let answerHandler;

        switch (params.type) {
          case 'update':
            // get only new notifications - MUST have params.n
            answerHandler = 'addNotificationsAtTop';
            break;
          case 'loadAfter':
            // scrolling event - MUST have params.lower
            break;
          default:
            answerHandler = 'addNotifications';
        }

        cache.getNotifications(params.n, params.lower)
        .then((nitems) => {
          let response = msg.cloneForAnswer([answerHandler], nitems);
          respond(response);
        })
        .catch((err) => {
          let response = msg.cloneForAnswer(['error'], err);
          respond(response);
        });
      },
      getConversations: (msg, respond) => {
        cache.getConversations(7, 1)
        .then((pcItems) => {
          let response = msg.cloneForAnswer(['addConversations'], pcItems);
          respond(response);
        })
        .catch((err) => {
          let response = msg.cloneForAnswer(['error'], err);
          respond(response);
        });
      }
    }, 'bg/app');

    // init chain
    // @ifdef DEV
    awaitDevInit()
    .then((app) => app.dev.init(bgApp))
    .then(cache.init)
    // @endif
    // @ifndef DEV
    cache.init()
    // @endif
    .then(() => {
      // init Alarms
      bgApp.alarms = new Alarms(bgApp);
      // activate counter_stats alarm
      bgApp.alarms.startStats();
      // start listening for messages
      bgApp.messaging.listen();
    });
  };

  // TODO: a mess, but it works
  /*bgApp.pushStatsUpdate = (stats) => {
    return new Promise((resolve, reject) => {

      bgApp.messaging.ping('popup/app').then((res) => {
        if (!res) {
          let err = new Error('Can\'t push status update. Popup isn\'t open.');
          err.code = 'ENORECEIVER';
          return reject(err);
        }
        devlog('updating query result');
        let keys = ['notifications', 'messages'];
        let updates = { notifications: 0, messages: 0 };
        let updatedValues = _.pick(stats, keys);
        let cachedValues = _.pick(bgApp.getCache('stats').data, keys);
        _.assignWith(updates, updatedValues, cachedValues, (updatedCount, cachedCount) => {
          let newCount = updatedCount - cachedCount;
          return newCount < 1 ? 0 : newCount;
        });
        bgApp.messaging.send('popup/app', ['updateStats'], updates);
        resolve(stats.data);
      });
    });
  };*/

  /**
   * Update browserAction icon and badge
   * @param {APIClient.NStatus} status
   * @return {APIClient.NStatus} Just passing the input through
   * @see Alarms#fireStats
   * @memberOf module:bg/app
   */
  bgApp.updateBrowserAction = (status) => {
    devlog('Updating browserAction with:', status);

    if (status === false) {
      chrome.browserAction.setBadgeBackgroundColor({ color: [ 255, 0, 0, 255 ] });
      chrome.browserAction.setBadgeText({ text: '!' });
      return;
    }

    let iconPath = `images/icon-${status.hasNew ? 'unread' : 'read'}_16.png`;
    chrome.browserAction.setIcon({ path: iconPath });

    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });
    chrome.browserAction.setBadgeText({ text: status.hasNew ? status.allNew + '' : '' });

    return status;
  };

  // fires when extension (i.e. user's profile) starts up
  // chrome.runtime.onStartup.addListener();

  // fires when extension is installed or reloaded on extension page
  chrome.runtime.onInstalled.addListener(details => {
    devlog('onInstalled:', details);
  });

  // init extension
  bgApp.init();

  return bgApp;

});
