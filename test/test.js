/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var assert = require('chai').assert;
var gas = require('gas-local');
var MockUrlFetchApp = require('./mocks/urlfetchapp');
var MockProperties = require('./mocks/properties');
var MockCache = require('./mocks/cache');
var MockLock = require('./mocks/lock');
var MockScriptApp = require('./mocks/script');
var MockUtilities = require('./mocks/utilities');

var mocks = {
  ScriptApp: new MockScriptApp(),
  UrlFetchApp: new MockUrlFetchApp(),
  Utilities: new MockUtilities(),
  __proto__: gas.globalMockDefault
};
var OAuth2 = gas.require('./src', mocks);

describe('OAuth2', () => {
  describe('#getServiceNames()', () => {
    it('should return the service names for stored tokens', () => {
      var props = new MockProperties({
        'oauth2.foo': '{"access_token": "abc"}',
        'oauth2.bar': '{"access_token": "abc"}',
      });

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, ['foo', 'bar']);
    });

    it('should return an empty array when no tokens are stored', () => {
      var props = new MockProperties();

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, []);
    });

    it('should ignore keys without a service name', () => {
      var props = new MockProperties({
        'oauth2.': 'foo',
        'oauth2..bar': 'bar',
      });

      var names = OAuth2.getServiceNames(props);

      assert.deepEqual(names, []);
    });

    it('should not have duplicate names when there are custom keys', () => {
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

describe('Service', () => {
  describe('#getToken()', () => {
    it('should return null when no token is stored', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());

      assert.equal(service.getToken(), null);
    });

    it('should return null after the service is reset', () => {
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

    it('should load from the cache', () => {
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

    it('should load from the properties and set the cache', () => {
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

    it('should not hit the cache or properties on subsequent calls', () => {
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

    it('should skip the local memory cache when desired', () => {
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

    it('should load null tokens from the cache', () => {
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

    it('should load null tokens from memory', () => {
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

    it('should not fail if no properties are set', () => {
      var service = OAuth2.createService('test');
      service.getToken();
    });
  });

  describe('#saveToken_()', () => {
    it('should save the token to the properties and cache', () => {
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

    it('should not fail if no properties are set', () => {
      var service = OAuth2.createService('test');
      var token = {
        access_token: 'foo'
      };
      service.saveToken_(token);
    });
  });

  describe('#reset()', () => {
    it('should delete the token from properties and cache', () => {
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

    it('should delete values in storage', () => {
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

    it('should not delete values from other services', () => {
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
      for (const [key, value] of Object.entries(values)) {
        properties.setProperty(key, value);
        cache.put(key, value);
      }

      service.reset();

      for (const [key, value] of Object.entries(values)) {
        assert.equal(cache.get(key), value);
        assert.equal(properties.getProperty(key), value);
      }
    });
  });

  describe('#hasAccess()', () => {
    it('should use the lock to prevent concurrent access', (done) => {
      var token = {
        granted_time: 100,
        expires_in: 100,
        refresh_token: 'bar'
      };
      var lock = new MockLock();
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });

      mocks.UrlFetchApp.delayFunction = () => 100;
      mocks.UrlFetchApp.resultFunction = () => JSON.stringify({
        access_token: Math.random().toString(36)
      });

      var service = OAuth2.createService('test')
          .setClientId('abc')
          .setClientSecret('def')
          .setTokenUrl('http://www.example.com')
          .setPropertyStore(properties)
          .setLock(lock);
      service.hasAccess();
      assert.equal(lock.counter, 1);
      done();
    });

    it('should not acquire a lock when the token is not expired', () => {
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

    it('should not acquire a lock when there is no refresh token', () => {
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

  describe('#refresh()', () => {
    it('should use the lock to prevent race conditions', (done) => {
      var token = {
        granted_time: 100,
        expires_in: 0,
        refresh_token: 'bar'
      };
      var lock = new MockLock();
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });

      mocks.UrlFetchApp.resultFunction = () => JSON.stringify({
        access_token: Math.random().toString(36)
      });
      OAuth2.createService('test')
          .setClientId('abc')
          .setClientSecret('def')
          .setTokenUrl('http://www.example.com')
          .setPropertyStore(properties)
          .setLock(lock)
          .refresh();
      assert.equal(lock.counter, 1);
      done();
    });

    it('should retain refresh expiry', () => {
      const NOW_SECONDS = OAuth2.getTimeInSeconds_(new Date());
      const ONE_HOUR_AGO_SECONDS = NOW_SECONDS - 360;
      var token = {
        granted_time: ONE_HOUR_AGO_SECONDS,
        expires_in: 100,
        refresh_token: 'bar',
        refresh_token_expires_in: 720
      };
      var properties = new MockProperties({
        'oauth2.test': JSON.stringify(token)
      });

      mocks.UrlFetchApp.resultFunction = () => {
        return JSON.stringify({
          access_token: 'token'
        });
      };

      OAuth2.createService('test')
          .setClientId('abc')
          .setClientSecret('def')
          .setTokenUrl('http://www.example.com')
          .setPropertyStore(properties)
          .setLock(new MockLock())
          .refresh();

      var storedToken = JSON.parse(properties.getProperty('oauth2.test'));
      assert.equal(storedToken.access_token, 'token');
      assert.equal(storedToken.refresh_token, 'bar');
      assert.equal(storedToken.refreshTokenExpiresAt, NOW_SECONDS + 360);
    });
  });

  describe('#exchangeGrant_()', () => {
    var toLowerCaseKeys_ = OAuth2.toLowerCaseKeys_;

    it('should not set auth header if not client_credentials', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
        assert.isUndefined(toLowerCaseKeys_(urlOptions.headers).authorization);
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('fake')
          .setTokenUrl('http://www.example.com');
      service.exchangeGrant_();
    });

    it('should not set auth header if the client ID is not set', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
        assert.isUndefined(toLowerCaseKeys_(urlOptions.headers).authorization);
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com');
      service.exchangeGrant_();
    });

    it('should not set auth header if the client secret is not set', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
        assert.isUndefined(toLowerCaseKeys_(urlOptions.headers).authorization);
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com')
          .setClientId('abc');
      service.exchangeGrant_();
    });

    it('should not set auth header if it is already set', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
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
        'is not already set', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
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

  describe('#generateCodeVerifier()', () => {
    it('should not include code challenge unless requested', () => {
      var service = OAuth2.createService('test')
          .setAuthorizationBaseUrl('http://www.example.com')
          .setClientId('abc')
          .setClientSecret('def')
          .setCallbackFunction('authCallback');
      var authorizationUrl = service.getAuthorizationUrl({});
      assert.notInclude(authorizationUrl, 'code_challenge');
      assert.notInclude(authorizationUrl, 'code_challenge_method');
    });

    it('should use generated challenge string', () => {
      var service = OAuth2.createService('test')
          .setAuthorizationBaseUrl('http://www.example.com')
          .setClientId('abc')
          .setClientSecret('def')
          .setCallbackFunction('authCallback')
          .generateCodeVerifier();
      var authorizationUrl = service.getAuthorizationUrl({});
      assert.include(authorizationUrl, 'code_challenge');
      assert.include(authorizationUrl, 'code_challenge_method=S256');
    });


    it('should use supply verifier when exchanging code', () => {
      var service = OAuth2.createService('test')
          .setAuthorizationBaseUrl('http://www.example.com')
          .setTokenUrl('http://www.example.com/token')
          .setClientId('abc')
          .setCallbackFunction('authCallback')
          .generateCodeVerifier();
      var authorizationUrl = service.getAuthorizationUrl({});
      var state = extractStateTokenFromUrl(authorizationUrl);
      mocks.UrlFetchApp.resultFunction = (url, opts) => {
        assert.isNotNull(opts.payload.code_verifier, 'Code verifier not present');
        return `{ "access_token": "123" }`;
      };
      service.handleCallback({
        parameter: Object.assign({
          code: 'test',
        }, state.arguments)
      });
    });
  });

  describe('#getAuthorizationUrl()', () => {
    it('should add additional parameters to the state token', () => {
      var service = OAuth2.createService('test')
          .setAuthorizationBaseUrl('http://www.example.com')
          .setClientId('abc')
          .setClientSecret('def')
          .setCallbackFunction('authCallback');
      var authorizationUrl = service.getAuthorizationUrl({
        foo: 'bar'
      });

      var state = extractStateTokenFromUrl(authorizationUrl);
      assert.equal(state.arguments.foo, 'bar');
    });
  });

  describe('#ensureExpiresAtSet_()', () => {
    const NOW_SECONDS = OAuth2.getTimeInSeconds_(new Date());
    var service = OAuth2.createService('test')
        .setPropertyStore(new MockProperties())
        .setCache(new MockCache());

    it('should set expires at', () => {
      const token = {
        granted_time: NOW_SECONDS,
        expires_in_sec: 100
      };
      service.ensureExpiresAtSet_(token);
      assert.include(token, {
        expiresAt: NOW_SECONDS + 100
      });
    });

    it('should set refresh expires at', () => {
      const token = {
        granted_time: NOW_SECONDS,
        refresh_token_expires_in: 200
      };
      service.ensureExpiresAtSet_(token);
      assert.include(token, {
        refreshTokenExpiresAt: NOW_SECONDS + 200
      });
    });
  });

  describe('#canRefresh_()', () => {
    const NOW_SECONDS = OAuth2.getTimeInSeconds_(new Date());
    const ONE_HOUR_AGO_SECONDS = NOW_SECONDS - 360;
    const ONE_HOUR_LATER_SECONDS = NOW_SECONDS + 360;
    var service = OAuth2.createService('test')
        .setPropertyStore(new MockProperties())
        .setCache(new MockCache());

    it('should return false if no refresh token', () => {
      const token = {};
      assert.isFalse(service.canRefresh_(token));
    });

    it('should return true if there is a refresh token', () => {
      const token = {
        refresh_token: 'bar',
      };
      assert.isTrue(service.canRefresh_(token));
    });

    it('should return true if it is not expired', () => {
      const token = {
        refresh_token: 'bar',
        expiresAt: ONE_HOUR_LATER_SECONDS,
        refreshTokenExpiresAt: ONE_HOUR_LATER_SECONDS
      };
      console.log('test');
      assert.isTrue(service.canRefresh_(token));
    });

    it('should return false if it is expired', () => {
      const token = {
        refresh_token: 'bar',
        expiresAt: ONE_HOUR_LATER_SECONDS,
        refreshTokenExpiresAt: ONE_HOUR_AGO_SECONDS
      };
      assert.isFalse(service.canRefresh_(token));
    });
  });

  describe('#isExpired_()', () => {
    const NOW_SECONDS = OAuth2.getTimeInSeconds_(new Date());
    const ONE_HOUR_AGO_SECONDS = NOW_SECONDS - 360;


    it('should return false if there is no expiration time', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {};

      assert.isFalse(service.isExpired_(token));
    });

    it('should return false if before the time in expires_in', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isFalse(service.isExpired_(token));
    });

    it('should return true if past the time in "expires_in"', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return false if before the time in "expires"', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isFalse(service.isExpired_(token));
    });

    it('should return true if past the time in "expires"', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return false if before the time in "expires_in_sec"', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 360, // One hour.
        granted_time: NOW_SECONDS,
      };

      assert.isFalse(service.isExpired_(token));
    });

    it('should return true if past the time in "expires_in_sec"', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 60, // One minute.
        granted_time: ONE_HOUR_AGO_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return true if within the buffer', () => {
      var service = OAuth2.createService('test')
          .setPropertyStore(new MockProperties())
          .setCache(new MockCache());
      var token = {
        expires_in: 30, // 30 seconds.
        granted_time: NOW_SECONDS,
      };

      assert.isTrue(service.isExpired_(token));
    });

    it('should return true if past the JWT expiration', () => {
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

    it('should return false if the JWT is expired but the token is not', () => {
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

    it('should return false if the token expired but the JWT is not', () => {
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

describe('Utilities', () => {
  describe('#extend_()', () => {
    var extend_ = OAuth2.extend_;
    var baseObj = {foo: [3]}; // An object with a non-primitive key-value
    it('should extend (left) an object', () => {
      var o = extend_(baseObj, {bar: 2});
      assert.deepEqual(o, {foo: [3], bar: 2});
    });
    it('should extend (right) an object', () => {
      var o = extend_({bar: 2}, baseObj);
      assert.deepEqual(o, {foo: [3], bar: 2});
    });
    it('should extend (merge) an object', () => {
      var o = extend_(baseObj, {foo: [100], bar: 2, baz: {}});
      assert.deepEqual(o, {foo: [100], bar: 2, baz: {}});
    });
  });

  describe('#toLowerCaseKeys_()', () => {
    var toLowerCaseKeys_ = OAuth2.toLowerCaseKeys_;

    it('should contain only lower-case keys', () => {
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

    it('should handle null, undefined, and empty objects', () => {
      assert.isNull(toLowerCaseKeys_(null));
      assert.isUndefined(toLowerCaseKeys_(undefined));
      assert.isEmpty(toLowerCaseKeys_({}));
    });
  });

  describe('#encodeJwt_()', () => {
    var encodeJwt_ = OAuth2.encodeJwt_;

    it('should encode correctly', () => {
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

  describe('#decodeJwt_()', () => {
    var decodeJwt_ = OAuth2.decodeJwt_;

    it('should decode correctly', () => {
      var jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIifQ.sig';

      var payload = decodeJwt_(jwt);

      assert.deepEqual(payload, {'foo': 'bar'});
    });
  });

  describe('#setTokenMethod()', () => {
    it('should defautl to POST', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
        assert.equal(urlOptions.method, 'post');
        done();
      };
      var service = OAuth2.createService('test')
          .setGrantType('client_credentials')
          .setTokenUrl('http://www.example.com');
      service.exchangeGrant_();
    });

    it('should change the HTTP method used', (done) => {
      mocks.UrlFetchApp.resultFunction = (url, urlOptions) => {
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


/*
 *Extract the state token from the URL and parse it. For example, the
 * URL http://www.example.com?state=%7B%22a%22%3A1%7D would produce
 * {a: 1}.
 */
function extractStateTokenFromUrl(authorizationUrl) {
  var querystring = authorizationUrl.split('?')[1];
  var params = querystring.split('&').reduce((result, pair) => {
    var parts = pair.split('=').map(decodeURIComponent);
    result[parts[0]] = parts[1];
    return result;
  }, {});
  var state = JSON.parse(params.state);
  return state;
}

