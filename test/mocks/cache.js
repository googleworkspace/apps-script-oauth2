var MockCache = function(opt_store) {
  this.store = opt_store || {};
};

MockCache.prototype.get = function(key) {
  return this.store[key];
};

MockCache.prototype.put = function(key, value) {
  this.store[key] = value;
};

MockCache.prototype.remove = function(key) {
  delete this.store[key];
};

module.exports = MockCache;
