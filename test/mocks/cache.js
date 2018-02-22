var MockCache = function() {
  this.store = {};
  this.counter = 0;
};

MockCache.prototype.get = function(key) {
  ++this.counter;
  return this.store[key];
};

MockCache.prototype.put = function(key, value) {
  this.store[key] = value;
};

MockCache.prototype.remove = function(key) {
  delete this.store[key];
};

module.exports = MockCache;
