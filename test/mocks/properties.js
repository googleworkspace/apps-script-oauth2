var MockProperties = function() {
  this.store = {};
};

MockProperties.prototype.getProperty = function(key) {
  return this.store[key];
};

MockProperties.prototype.setProperty = function(key, value) {
  this.store[key] = value;
};

MockProperties.prototype.deleteProperty = function(key) {
  delete this.store[key];
};

module.exports = MockProperties;
