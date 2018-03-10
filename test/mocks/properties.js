var MockProperties = function(optStore) {
  this.store = optStore || {};
  this.counter = 0;
};

MockProperties.prototype.getProperty = function(key) {
  ++this.counter;
  return this.store[key];
};

MockProperties.prototype.setProperty = function(key, value) {
  this.store[key] = value;
};

MockProperties.prototype.deleteProperty = function(key) {
  delete this.store[key];
};

module.exports = MockProperties;
