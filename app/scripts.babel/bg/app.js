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
    messaging: null, // -> .init()
    /**
     * Holds answer data from API requests and their timeout values
     * @type {object}
     * @memberOf module:bg/app
     */
    requestCaches: {
      stats: new cache.StatsCache({
        messages: 0, notifications: 0,
        users: 0, all: 0
      }, 0)
    }
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
   * Checks cache timeout for requested data.
   * - Resolves with cached data if API should be omitted.
   * @param  {string} cacheName - Must be member of module:bg/app.
   * @return {Promise}          - Resolves with cached data if still in request timeout
   */
  bgApp.getCache = (cacheName) => bgApp.requestCaches[cacheName];

  /**
   * Updates local stats
   * @memberOf module:bg/app
   * @return {Promise} - Resolves with Array of {@link APIClient.NItem|NItems}; Rejects with ENOTOKEN if not logged in
   */
  bgApp.getStats = () => {

    return bgApp.api.getCounterStats(bgApp.getCache('stats'))
          .then((counter_stats) => {
            let statsObj;
            // not expired cache
            if (counter_stats.hasExpired === false) {
              statsObj = counter_stats.data;
              statsObj.cached = true;
            } else {
              // parse JSON string and update cache
              statsObj = JSON.parse(counter_stats);
              bgApp.requestCaches.stats.data = statsObj;
            }
            return statsObj;
          });
  };

  bgApp.pushStatsUpdate = (stats) => {
    // cached data can't have updates, can it?
    if (stats.cached) {
      return stats.data;
    }
    bgApp.messaging.ping('popup/app').then((res) => {
      if (!res) {
        return;
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
    });
    return stats.data;
  };

  /**
   * Updates notifications
   * @memberOf module:bg/app
   * @return {Promise} - Resolves with Array of {@link APIClient.NItem|NItems}; Rejects with ENOTOKEN if not logged in
   */
  bgApp.getNotifications = (n, lower) => {

    // defaults to the 7 most recent notifications
    n = n || 7;
    lower = lower || 0;

    return bgApp.api.getNotifications(n, lower, null)
    .then((raw) => {
      let parsed;
      if (typeof raw !== 'string') {
        parsed = raw;
      } else {
        parsed = JSON.parse(raw).notifications;
      }

      /**
       * strip notifications that defy the standard object layout
       * e.g. NType.NEWGROUP (501) doesn't have a hood_message
       * member. Skip everything but some standard messages
       * @todo proper error/NType handling
       * @type {Array.<Number>}
       */
      let safeTypes = [
        APIClient.NType.EVENT,
        APIClient.NType.MARKET,
        APIClient.NType.ANSWER,
        APIClient.NType.FEED
      ];
      parsed = parsed.filter((n) => safeTypes.includes(n.notification_type_id) &&
                                    !n.hood_message.is_deleted);

      return parsed.map((n) => new APIClient.NItem(n));
    });
  };

  bgApp.getConversations = () => {
    return bgApp.api.getConversations(7, 1, null)
    .then((raw) => {
      let parsed;
      if (typeof raw !== 'string') {
        parsed = raw;
      } else {
        parsed = JSON.parse(raw);
      }

      let conversations = parsed.private_conversations;
      let linked_users = parsed.linked_users;

      return conversations.map((conversation) => {
        let partner = _.find(linked_users, [ 'id', conversation.partner_id]);
        return new APIClient.PCItem(conversation, partner);
      });
    });
  };

  /**
   * Update browserAction icon and badge
   * @param {module:bg/app.requestCaches.stats} stats
   * @return {module:bg/app.requestCaches.stats} Just passing the input through
   * @memberOf module:bg/app
   */
  bgApp.updateBrowserAction = (stats) => {
    devlog('Updating browserAction with:', stats);

    if (stats === false) {
      chrome.browserAction.setBadgeBackgroundColor({ color: [ 255, 0, 0, 255 ] });
      chrome.browserAction.setBadgeText({ text: '!' });
      return;
    }

    let allNew = stats.messages + stats.notifications;
    let hasNew = allNew > 0;

    let iconPath = `images/icon-${hasNew ? 'unread' : 'read'}_16.png`;
    chrome.browserAction.setIcon({ path: iconPath });

    chrome.browserAction.setBadgeBackgroundColor({ color: [ 28, 150, 6, 128 ] });
    chrome.browserAction.setBadgeText({ text: hasNew ? allNew + '' : '' });

    return stats;
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
