var assert = require('chai').assert;
var gas = require('gas-local');
var MockUrlFetchApp = require('./mocks/urlfetchapp');
var MockProperties = require('./mocks/properties');
var MockCache = require('./mocks/cache');
var MockLock = require('./mocks/lock');
var Future = require('fibers/future');

var mocks = {
  ScriptApp: {
    getScriptId: function() {
      return '12345';
    }
  },
  UrlFetchApp: new MockUrlFetchApp(),
  Utilities: {
    base64Encode: function(data) {
      return Buffer.from(data).toString('base64');
    }
  },
  __proto__: gas.globalMockDefault
};
var OAuth2 = gas.require('./src', mocks);

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
});
