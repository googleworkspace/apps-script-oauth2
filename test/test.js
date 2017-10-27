var assert = require('chai').assert;
var _ = require('underscore');
var gas = require('gas-local');
var MockProperties = require('./mocks/properties');
var MockCache = require('./mocks/cache');

var mocks = {
  Underscore: {
    load: function() {
      return _;
    }
  },
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
    it('should load from the in-memory store', function() {
      var service = OAuth2.createService('test')
        .setPropertyStore(new MockProperties())
        .setCache(new MockCache());
      var token = {
        access_token: 'foo'
      };
      service.token_ = token;

      assert.deepEqual(service.getToken(), token);
    });

    it('should load from the cache and set the in-memory store', function() {
      var cache = new MockCache();
      var service = OAuth2.createService('test')
        .setPropertyStore(new MockProperties())
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      cache.put(service.getPropertyKey_(), JSON.stringify(token));

      assert.notExists(service.token_);
      assert.deepEqual(service.getToken(), token);
      assert.deepEqual(service.token_, token);
    });

    it('should load from the properties and set the cache and in-memory store', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
        .setPropertyStore(properties)
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      var key = service.getPropertyKey_();
      properties.setProperty(key, JSON.stringify(token));


      assert.notExists(service.token_);
      assert.deepEqual(service.getToken(), token);
      assert.deepEqual(service.token_, token);
      assert.deepEqual(JSON.parse(cache.get(key)), token);
    });
  });

  describe('#saveToken_()', function() {
    it('should save the token to the properties, cache, and in-memory store', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
        .setPropertyStore(properties)
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };

      service.saveToken_(token);

      var key = service.getPropertyKey_();
      assert.deepEqual(service.token_, token);
      assert.deepEqual(JSON.parse(cache.get(key)), token);
      assert.deepEqual(JSON.parse(properties.getProperty(key)), token);
    });
  });

  describe('#reset()', function() {
    it('should delete the token from properties, cache, and in-memory store', function() {
      var cache = new MockCache();
      var properties = new MockProperties();
      var service = OAuth2.createService('test')
        .setPropertyStore(properties)
        .setCache(cache);
      var token = {
        access_token: 'foo'
      };
      var key = service.getPropertyKey_();
      properties.setProperty(key, JSON.stringify(token));
      cache.put(key, JSON.stringify(token));
      service.token_ = token;

      service.reset();

      assert.notExists(service.token_);
      assert.notExists(cache.get(key));
      assert.notExists(properties.getProperty(key));
    });
  });
});
