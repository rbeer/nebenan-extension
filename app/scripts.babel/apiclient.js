/**
 * @class Client to nebenan.de API
 */
export class APIClient {
  constructor() {
    this.options = APIClient.DEFAULTS;
  }

  /**
   * Default values for CMLHttpRequest
   */
  static get DEFAULTS() {
    return {
      type: 'GET',
      url: 'https://api.nebenan.de/'
    };
  }

  /**
   * Executes XMLHttpRequest
   * @memberOf APIClient
   * @static
   * @return {Promise}
   */
  static callAPI(options) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
          resolve(this.response);
        }
      };
      xhr.onerror = (err) => {
        xhr.abort();
        reject(err);
      };
      xhr.open(options.type, options.url);
      xhr.send();
    });
  }

  /**
   * Requests counter_stats.json
   * @see APIClient.callAPI
   * @memberOf APIClient
   * @static
   * @return {Promise}
   */
  static getCounterStats() {
    
  }

}
