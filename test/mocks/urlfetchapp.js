var Future = require('fibers/future');

var MockUrlFetchApp = function() {
  this.delay = 0;
  this.resultFunction = () => '';
};

MockUrlFetchApp.prototype.fetch = function(url, optOptions) {
  var delay = this.delay;
  if (delay) {
    sleep(delay).wait();
  }
  return {
    getContentText: this.resultFunction,
    getResponseCode: () => 200
  };
};

function sleep(ms) {
  var future = new Future;
  setTimeout(function() {
    future.return();
  }, ms);
  return future;
}

module.exports = MockUrlFetchApp;
