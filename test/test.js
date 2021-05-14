var assert = require('chai').assert;
var gas = require('gas-local');
var MockUrlFetchApp = require('./mocks/urlfetchapp');
var MockProperties = require('./mocks/properties');
var MockCache = require('./mocks/cache');
var MockLock = require('./mocks/lock');
var MockScriptApp = require('./mocks/script');
var MockBlob = require('./mocks/blob');
var Future = require('fibers/future');
var URLSafeBase64 = require('urlsafe-base64');

var mocks = {
  ScriptApp: new MockScriptApp(),
  UrlFetchApp: new MockUrlFetchApp(),
  Utilities: {
    base64Encode: function(data) {
      return Buffer.from(data).toString('base64');
    },
    base64EncodeWebSafe: function(data) {
      return URLSafeBase64.encode(Buffer.from(data));
    },
    base64DecodeWebSafe: function(data) {
      return URLSafeBase64.decode(data);
    },
    computeRsaSha256Signature: function(data, key) {
      return Math.random().toString(36);
    },
    newBlob: function(data) {
      return new MockBlob(data);
    },
  },
  __proto__: gas.globalMockDefault
};
var OAuth2 = gas.require('./src', mocks);

describe('OAuth2', function() {
  describe('#getServiceNames()', function() {
    it('should return the service names for stored tokens', function() {
      var props = new MockProperties({
        'oauth2.foo': '{"access_token": "abc"}',
        'oauth2.bar': '{"access_token": "abc"}',
      });

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, ['foo', 'bar']);
    });

    it('should return an empty array when no tokens are stored', function() {
      var props = new MockProperties();

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, []);
    });

    it('should ignore keys without a service name', function() {
      var props = new MockProperties({
        'oauth2.': 'foo',
        'oauth2..bar': 'bar',
      });

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, []);
    });

    it('should not have duplicate names when there are custom keys',
        function() {
      var props = new MockProperties({
        'oauth2.foo': '{"access_token": "abc"}',
        'oauth2.foo.extra': 'my extra stuff',
        'oauth2.foo.extra2': 'more extra stuff',
      });

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, ['foo']);
    });
  });
});

describe('Service', function() {
  describe('#getToken()', function() {
    it('should return null when no token is stored', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());

      assert.equal(service.getToken(), null);
    });

    it('should return null after the service is reset', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        access_token: 'foo'
      };
      service.saveToken_(token);
      assert.deepEqual(service.getToken(), token);

      service.reset();
      assert.equal(service.getToken(), null);
    });

    it('should load from the cache', function() {
      var token = {
        access_token: 'foo'
      };
      var cache = new MockCache({
        'oauth2.test': JSON.stringify(token)
      });
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(cache);
      assert.deepEqual(service.getToken(), token);
    });

    it('should load from the properties and set the cache', function() {
      var token = {
        access_token: 'foo'
      };
      var cache = new MockCache();
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);

      assert.deepEqual(service.getToken(), token);
      assert.deepEqual(JSON.parse(cache.get('oauth2.test')), token);
    });

    it('should not hit the cache or properties on subsequent calls',
        function() {
      var cache = new MockCache();
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify({
          access_token: 'foo'
        })
      });
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);

      service.getToken();
      var cacheStart = cache.counter;
      var propertiesStart = properties.counter;
      for (var i = 0; i < 10; ++i) {
        service.getToken();
      }
      assert.equal(cache.counter, cacheStart);
      assert.equal(properties.counter, propertiesStart);
    });

    it('should skip the local memory cache when desired', function() {
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
          .setPropertyStore(properties);
      var token = {
        access_token: 'foo'
      };
      service.saveToken_(token);

      var newToken = {
        access_token: 'bar'
      };
      properties.setProperty('oauth2.test', JSON.stringify(newToken));

      assert.deepEqual(service.getToken(true), newToken);
    });

    it('should load null tokens from the cache',
        function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      for (var i = 0; i < 10; ++i) {
        var service = OAuth2.createService('test')
            .setPropertyStore(properties)
            .setCache(cache);
        service.getToken();
      }
      assert.equal(properties.counter, 1);
    });

    it('should load null tokens from memory',
        function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);

      service.getToken();
      var cacheStart = cache.counter;
      var propertiesStart = properties.counter;
      for (var i = 0; i < 10; ++i) {
        service.getToken();
      }
      assert.equal(cache.counter, cacheStart);
      assert.equal(properties.counter, propertiesStart);
    });

    it('should not fail if no properties are set',
        function() {
      var service = OAuth2.createService('test');
      service.getToken();
    });
  });

  describe('#saveToken_()', function() {
    it('should save the token to the properties and cache', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      service.saveToken_(token);

      var key = 'oauth2.test';
      assert.deepEqual(JSON.parse(cache.get(key)), token);
      assert.deepEqual(JSON.parse(properties.getProperty(key)), token);
    });

    it('should not fail if no properties are set',
        function() {
      var service = OAuth2.createService('test');
      var token = {
        access_token: 'foo'
      };
      service.saveToken_(token);
    });
  });

  describe('#reset()', function() {
    it('should delete the token from properties and cache', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);
      var key = 'oauth2.test';
      var token = {
        access_token: 'foo'
      };
      properties.setProperty(key, JSON.stringify(token));
      cache.put(key, JSON.stringify(token));
      service.token_ = token;

      service.reset();

      assert.notExists(cache.get(key));
      assert.notExists(properties.getProperty(key));
    });

    it('should delete values in storage', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);
      var storage = service.getStorage();
      storage.setValue('foo', 'bar');

      service.reset();

      assert.notExists(storage.getValue('foo'));
    });

    it('should not delete values from other services', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
          .setPropertyStore(properties)
          .setCache(cache);
      var values = {
        'oauth2.something': 'token',
        'oauth2.something.foo': 'bar',
        'oauth2.something.test': 'baz',
        'oauth2.testing': 'token',
        'oauth2.testing.foo': 'bar',
      };
      for (let [key, value] of Object.entries(values)) {
        properties.setProperty(key, value);
        cache.put(key, value);
      }

      service.reset();

      for (let [key, value] of Object.entries(values)) {
        assert.equal(cache.get(key), value);
        assert.equal(properties.getProperty(key), value);
      }
    });
  });

  describe('#hasAccess()', function() {
    it('should use the lock to prevent concurrent access', function(done) {
      var token = {
        granted_time: 100,
        expires_in: 100,
        refresh_token: 'bar'
      };
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });

      mocks.UrlFetchApp.delayFunction = () => 100;
      mocks.UrlFetchApp.resultFunction = () => JSON.stringify({
        access_token: Math.random().toString(36)
      });

      var getAccessToken = function() {
        var service = OAuth2.createService('test')
            .setClientId('abc')
            .setClientSecret('def')
            .setTokenUrl('http://www.example.com')
            .setPropertyStore(properties)
            .setLock(new MockLock());
        if (service.hasAccess()) {
          return service.getAccessToken();
        } else {
          throw new Error('No access: ' + service.getLastError());
        };
      }.future();

      Future.task(function() {
        var first = getAccessToken();
        var second = getAccessToken();
        Future.wait(first, second);
        return [first.get(), second.get()];
      }).resolve(function(err, accessTokens) {
        if (err) {
          done(err);
        }
        assert.equal(accessTokens[0], accessTokens[1]);
        done();
      });
    });

    it('should not acquire a lock when the token is not expired', function() {
      var token = {
        granted_time: (new Date()).getTime(),
        expires_in: 1000,
        access_token: 'foo',
        refresh_token: 'bar'
      };
      var lock = new MockLock();
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });
      var service = OAuth2.createService('test')
          .setClientId('abc')
          .setClientSecret('def')
          .setTokenUrl('http://www.example.com')
          .setPropertyStore(properties)
          .setLock(lock);
      service.hasAccess();
      assert.equal(lock.counter, 0);
    });

    it('should not acquire a lock when there is no refresh token', function() {
      var token = {
        granted_time: 100,
        expires_in: 100,
        access_token: 'foo',
      };
      var lock = new MockLock();
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });
      var service = OAuth2.createService('test')
          .setClientId('abc')
          .setClientSecret('def')
          .setTokenUrl('http://www.example.com')
          .setPropertyStore(properties)
          .setLock(lock);
      service.hasAccess();
      assert.equal(lock.counter, 0);
    });
  });

  describe('#refresh()', function() {
    /*
      A race condition can occur when two executions attempt to refresh the
      token at the same time. Some OAuth implementations only allow one
      valid access token at a time, so we need to ensure that the last access
      token granted is the one that is persisted. To replicate this, we have the
      first exeuction wait longer for it's response to return through the
      "network" and have the second execution get it's response back sooner.
    */
    it('should use the lock to prevent race conditions', function(done) {
      var token = {
        granted_time: 100,
        expires_in: 100,
        refresh_token: 'bar'
      };
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });

      var count = 0;
      mocks.UrlFetchApp.resultFunction = function() {
        return JSON.stringify({
          access_token: 'token' + count++
        });
      };
      var delayGenerator = function*() {
        yield 100;
        yield 10;
      }();
      mocks.UrlFetchApp.delayFunction = function() {
        return delayGenerator.next().value;
      };

      var refreshToken = function() {
        OAuth2.createService('test')
            .setClientId('abc')
            .setClientSecret('def')
            .setTokenUrl('http://www.example.com')
            .setPropertyStore(properties)
            .setLock(new MockLock())
            .refresh();
      }.future();

      Future.task(function() {
        var first = refreshToken();
        var second = refreshToken();
        Future.wait(first, second);
        return [first.get(), second.get()];
      }).resolve(function(err) {
        if (err) {
          done(err);
        }
        var storedToken = JSON.parse(properties.getProperty('oauth2.test'));
        assert.equal(storedToken.access_token, 'token1');
        done();
      });
    });
  });

  describe('#exchangeGrant_()', function() {
    var toLowerCaseKeys_ = OAuth2.toLowerCaseKeys_;

    it('should not set auth header if the grant type is not client_credentials',
        function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.isUndefined(toLowerCaseKeys_(urlOptions.headers).authorization);
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('fake')
          .setTokenUrl('http://www.example.com');
      service.exchangeGrant_();
    });

    it('should not set auth header if the client ID is not set',
        function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.isUndefined(toLowerCaseKeys_(urlOptions.headers).authorization);
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com');
      service.exchangeGrant_();
    });

    it('should not set auth header if the client secret is not set',
        function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.isUndefined(toLowerCaseKeys_(urlOptions.headers).authorization);
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com')
          .setClientId('abc');
      service.exchangeGrant_();
    });

    it('should not set auth header if it is already set',
        function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.equal(toLowerCaseKeys_(urlOptions.headers).authorization,
            'something');
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com')
          .setClientId('abc')
          .setClientSecret('def')
          .setTokenHeaders({
            authorization: 'something'
          });
      service.exchangeGrant_();
    });

    it('should set the auth header for the client_credentials grant type, if ' +
        'the client ID and client secret are set and the authorization header' +
        'is not already set', function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.equal(toLowerCaseKeys_(urlOptions.headers).authorization,
            'Basic YWJjOmRlZg==');
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com')
          .setClientId('abc')
          .setClientSecret('def');
      service.exchangeGrant_();
    });
  });

  describe('#getAuthorizationUrl()', function() {
    it('should add additional parameters to the state token', function() {
      var service = OAuth2.createService('test')
          .setAuthorizationBaseUrl('http://www.example.com')
          .setClientId('abc')
          .setClientSecret('def')
          .setCallbackFunction('authCallback');
      var authorizationUrl = service.getAuthorizationUrl({
        foo: 'bar'
      });

      // Extract the state token from the URL and parse it. For example, the
      // URL http://www.example.com?state=%7B%22a%22%3A1%7D would produce
      // {a: 1}.
      var querystring = authorizationUrl.split('?')[1];
      var params = querystring.split('&').reduce(function(result, pair) {
        var parts = pair.split('=').map(decodeURIComponent);
        result[parts[0]] = parts[1];
        return result;
      }, {});
      var state = JSON.parse(params.state);

      assert.equal(state.arguments.foo, 'bar');
    });
  });

  describe('#isExpired_()', function() {
    const NOW_SECONDS = OAuth2.getTimeInSeconds_(new Date());
    const ONE_HOUR_AGO_SECONDS = NOW_SECONDS - 360;


    it('should return false if there is no expiration time in the token',
        function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {};

      assert.isFalse(service.isExpired_(token));
    });

    it('should return false if before the time in expires_in', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isFalse(service.isExpired_(token));
    });

    it('should return true if past the time in "expires_in"', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return false if before the time in "expires"', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isFalse(service.isExpired_(token));
    });

    it('should return true if past the time in "expires"', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return false if before the time in "expires_in_sec"',
        function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isFalse(service.isExpired_(token));
    });

    it('should return true if past the time in "expires_in_sec"', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return true if within the buffer', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 30, // 30 seconds.
        granted_time: NOW_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return true if past the JWT expiration', function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var idToken = OAuth2.encodeJwt_({
            exp: NOW_SECONDS - 60, // One minute ago.
          }, 'key');
      var token = {
        id_token: idToken,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return false if the JWT is expired but the token is not',
        function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var idToken = OAuth2.encodeJwt_({
            exp: NOW_SECONDS - 60, // One minute ago.
          }, 'key');
      var token = {
        id_token: idToken,
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return false if the token expired but the JWT is not',
        function() {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var idToken = OAuth2.encodeJwt_({
            exp: NOW_SECONDS + 360, // One hour from now.
          }, 'key');
      var token = {
        id_token: idToken,
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });
  });
});

describe('Utilities', function() {
  describe('#extend_()', function() {
    var extend_ = OAuth2.extend_;
    var baseObj = {foo: [3]}; // An object with a non-primitive key-value
    it('should extend (left) an object', function() {
      var o = extend_(baseObj, {bar: 2});
      assert.deepEqual(o, {foo: [3], bar: 2});
    });
    it('should extend (right) an object', function() {
      var o = extend_({bar: 2}, baseObj);
      assert.deepEqual(o, {foo: [3], bar: 2});
    });
    it('should extend (merge) an object', function() {
      var o = extend_(baseObj, {foo: [100], bar: 2, baz: {}});
      assert.deepEqual(o, {foo: [100], bar: 2, baz: {}});
    });
  });

  describe('#toLowerCaseKeys_()', function() {
    var toLowerCaseKeys_ = OAuth2.toLowerCaseKeys_;

    it('should contain only lower-case keys', function() {
      var data = {
        'a': true,
        'A': true,
        'B': true,
        'Cc': true,
        'D2': true,
        'E!@#': true
      };
      var lowerCaseData = toLowerCaseKeys_(data);
      assert.deepEqual(lowerCaseData, {
        'a': true,
        'b': true,
        'cc': true,
        'd2': true,
        'e!@#': true
      });
    });

    it('should handle null, undefined, and empty objects', function() {
      assert.isNull(toLowerCaseKeys_(null));
      assert.isUndefined(toLowerCaseKeys_(undefined));
      assert.isEmpty(toLowerCaseKeys_({}));
    });
  });

  describe('#encodeJwt_()', function() {
    var encodeJwt_ = OAuth2.encodeJwt_;

    it('should encode correctly', function() {
      var payload = {
         'foo': 'bar'
      };

      var jwt = encodeJwt_(payload, 'key');
      var parts = jwt.split('.');

      // Expexted values from jwt.io.
      assert.equal(parts[0], 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9');
      assert.equal(parts[1], 'eyJmb28iOiJiYXIifQ');
    });
  });

  describe('#decodeJwt_()', function() {
    var decodeJwt_ = OAuth2.decodeJwt_;

    it('should decode correctly', function() {
      var jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIifQ.sig';

      var payload = decodeJwt_(jwt);

      assert.deepEqual(payload, {'foo': 'bar'});
    });
  });

  describe('#setTokenMethod()', function() {
    var decodeJwt_ = OAuth2.decodeJwt_;

    it('should defautl to POST', function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.equal(urlOptions.method, 'post');
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com')
      service.exchangeGrant_();
    });

    it('should change the HTTP method used', function(done) {
      mocks.UrlFetchApp.resultFunction = function(url, urlOptions) {
        assert.equal(urlOptions.method, 'put');
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com')
          .setTokenMethod('put');
      service.exchangeGrant_();
    });
  });
});
