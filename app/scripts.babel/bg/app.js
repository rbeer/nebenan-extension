'use strict';

define([
  'bg/alarms',
  'bg/apiclient',
  'bg/auth',
  'bg/livereload',
  'bg/cache',
  'messaging',
  'lodash'
], (Alarms, APIClient, auth, lreload, cache, Messaging, _) => {

  /**
   * Background Main App
   * @module bg/app
   */
  let bgApp = {
    api: APIClient,
    alarms: null, // -> .init()
    auth: auth,
    messaging: null // -> .init()
  };

  /**
   * DEV/Debug mode augmentations
   * Use `$ gulp dev` to activate
   */

  // noop when not in dev mode
  window.devlog = () => void 0;

  // @if DEV=true
  // included in .rjs-dev
  require(['bg/dev'], (dev) => {
    bgApp.dev = dev;
    bgApp.dev.init(bgApp);
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
      getStats: (msg, respond) => {
        bgApp.getStats()
        .then((stats) => {
          let response = msg.cloneForAnswer(['setStats'], stats);
          respond(response);
        })
        .catch((err) => {
          let response = msg.cloneForAnswer(['error'], err);
          respond(response);
        });
      },
      getNotifications: (msg, respond) => {
        let params = msg.payload || {};
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

        bgApp.getNotifications(params.n, params.lower)
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
        bgApp.getConversations()
        .then((pcItems) => {
          devlog('pcItems:', pcItems);
          let response = msg.cloneForAnswer(['addConversations'], pcItems);
          respond(response);
        })
        .catch((err) => {
          let response = msg.cloneForAnswer(['error'], err);
          respond(response);
        });
      }
    }, 'bg/app');
    // start listening for messages
    bgApp.messaging.listen();

    // init Alarms
    bgApp.alarms = new Alarms(bgApp);
    // activate counter_stats alarm
    bgApp.alarms.startStats();

  };

  /**
   * Queries API for counter_stats.json / {@link APIClient.NStatus}
   * @memberOf module:bg/app
   * @return {Promise.<Array.<APIClient.NStatus>, ENOTOKEN>}
   */
  bgApp.getStats = () => bgApp.api.getCounterStats();

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
   * Queries API for notifications.json / {@link APIClient.NItem}
   * @param {Number} n=7     - \# of notifications to request
   * @param {Number} lower=0 - Timestamp; query for notifications older than this value
   * @memberOf module:bg/app
   * @return {Promise.<Array.<APIClient.NItem>, ENOTOKEN>}
   */
  bgApp.getNotifications = (n, lower) => {
    // defaults to the 7 most recent notifications
    n = n || 7;
    lower = lower || 0;

    return bgApp.api.getNotifications(n, lower)
    .then((nitems) => {
      devlog(nitems);
      return nitems;
    });
  };

  /**
   * Queries API for private_conversations.json / {@link APIClient.PCItem}
   * @param {Number} perPage=7     - \# of conversations per request page
   * @param {Number} page=1        - \# of page to request. order of items is DESC date/time
   * @memberOf module:bg/app
   * @return {Promise.<Array.<APIClient.PCItem>, ENOTOKEN>}
   * @example
   * let pageRanges = (perPage) => {
   *   for (let page = 1; page <= 7; page++) {
   *     console.log('Page #' + page);
   *     console.log('First on page:', (page-1)*perPage);
   *     console.log('Last on page:', (page-1)*perPage + (perPage-1));
   *     console.log('-'.repeat(21));
   *   }
   * }
   * pageRanges(15)
   * pageRanges(1)
   * pageRanges(0)
   */
  bgApp.getConversations = (perPage, page) => {
    // defaults to first 7 conversations
    perPage = perPage || 7;
    page = page || 1;

    return bgApp.api.getConversations(perPage, page)
    .then((conversations) => {
      devlog(conversations);
      return conversations;
    });
  };

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
