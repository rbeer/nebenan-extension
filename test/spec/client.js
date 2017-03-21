/*
  GET /api/v2/profile/counter_stats.json HTTP/1.1
  Host: api.nebenan.de
  Connection: keep-alive
  Accept: application/json
  X-AUTH-TOKEN: ${cookies.s.value}
  User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.110 Safari/537.36
  Origin: https://nebenan.de
  DNT: 1
  Referer: https://nebenan.de/feed
  Accept-Encoding: gzip, deflate, sdch, br
  Accept-Language: de,en-US;q=0.8,en;q=0.6
  If-None-Match: W/"2a9d6fdda6a25f160b1b0f1612b17eb2"

  HTTP/1.1 200 OK
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Headers: x-requested-with, Content-Type, origin, authorization, accept, client-security-token, X-AUTH_TOKEN, X-AUTH-TOKEN, API-VERSION
  Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT
  Access-Control-Allow-Origin: *
  Access-Control-Max-Age: 1000
  Cache-Control: max-age=0, private, must-revalidate
  Content-Encoding: gzip
  Content-Type: application/json; charset=utf-8
  Date: Tue, 21 Mar 2017 06:14:07 GMT
  ETag: W/"2a9d6fdda6a25f160b1b0f1612b17eb2"
  Expires: Tue, 21 Mar 2017 06:14:07 GMT
  Server: Apache
  Status: 200 OK
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Vary: Origin,Accept-Encoding
  X-Content-Type-Options: nosniff
  X-Request-Id: 0ee0a486-2c25-41f3-8c04-a00614ed4bf1
  X-XSS-Protection: 1; mode=block
  Content-Length: 86
  Connection: keep-alive

  HTTP/1.1 304 Not Modified
  Cache-Control: max-age=0, private, must-revalidate
  Date: Tue, 21 Mar 2017 06:10:33 GMT
  ETag: W/"2a9d6fdda6a25f160b1b0f1612b17eb2"
  Expires: Thu, 20 Apr 2017 06:10:33 GMT
  Server: Apache
  Vary: Origin
  Connection: keep-alive
   */


/* global expect */

(function() {
  'use strict';

  describe('APIClient', () => {
    describe('.getCounterStats', () => {
      it('returns a Promise', done => {
        let counterStats = getCounterStats();
        expect(counterStats instanceof Promise).to.be.true;
        counterStats.then((data) => {
          console.log(data);
          done();
        });
      });
    });
  });
})();
