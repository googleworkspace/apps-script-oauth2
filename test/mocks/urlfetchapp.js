/**
 * @file Mocks out Apps Script's UrlFetchApp, using the fibers library to
 * emulate concurrent executions.
 */

var Future = require('fibers/future');

var MockUrlFetchApp = function() {
  this.delayFunction = () => 0;
  this.resultFunction = () => '';
};

MockUrlFetchApp.prototype.fetch = function(url, optOptions) {
  var delay = this.delayFunction();
  var result = this.resultFunction();
  if (delay) {
    sleep(delay).wait();
  }
  return {
    getContentText: () => result,
    getResponseCode: () => 200
  };
};

function sleep(ms) {
  var future = new Future();
  setTimeout(function() {
    future.return();
  }, ms);
  return future;
}

module.exports = MockUrlFetchApp;
