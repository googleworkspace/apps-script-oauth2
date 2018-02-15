var assert = require('chai').assert;
var gas = require('gas-local');
var MockProperties = require('./mocks/properties');
var MockCache = require('./mocks/cache');

var mocks = {
  ScriptApp: {
    getScriptId: function() {
      return '12345';
    }
  }
};
var options = {
  filter: function(f) {
    return true;
  }
};
var OAuth2 = gas.require('./src', mocks, options);

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
      var cache = new MockCache();
      var service = OAuth2.createService('test')
        .setPropertyStore(new MockProperties())
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      cache.put('oauth2.test', JSON.stringify(token));
      assert.deepEqual(service.getToken(), token);
    });

    it('should load from the properties and set the cache', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
        .setPropertyStore(properties)
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      var key = 'oauth2.test';
      properties.setProperty(key, JSON.stringify(token));
      assert.deepEqual(service.getToken(), token);
      assert.deepEqual(JSON.parse(cache.get(key)), token);
    });

    it('should not hit the cache or properties on subsequent calls', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
        .setPropertyStore(properties)
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      var key = 'oauth2.test';
      properties.setProperty(key, JSON.stringify(token));

      service.getToken();
      var cacheStart = cache.counter;
      var propertiesStart = properties.counter;
      for (var i = 0; i < 10; i++) {
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
      var token = {
        access_token: 'foo'
      };
      var key = 'oauth2.test';
      properties.setProperty(key, JSON.stringify(token));
      cache.put(key, JSON.stringify(token));
      service.token_ = token;

      service.reset();

      assert.notExists(cache.get(key));
      assert.notExists(properties.getProperty(key));
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
});
