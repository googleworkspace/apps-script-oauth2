var MockScriptApp = function() {};

MockScriptApp.prototype.getScriptId = function() {
  return Math.random().toString(36).substring(2);
};

MockScriptApp.prototype.newStateToken = function() {
  return new MockStateTokenBuilder();
};

var MockStateTokenBuilder = function() {
  this.arguments = {};
};

MockStateTokenBuilder.prototype.withMethod = function(method) {
  this.method = method;
  return this;
};

MockStateTokenBuilder.prototype.withArgument = function(key, value) {
  this.arguments[key] = value;
  return this;
};

MockStateTokenBuilder.prototype.withTimeout = function(timeout) {
  this.timeout = timeout;
  return this;
};

MockStateTokenBuilder.prototype.createToken = function() {
  return JSON.stringify(this);
};

module.exports = MockScriptApp;
