var Future = require('fibers/future'), wait = Future.wait;

var MockUrlFetchApp = function() {
  this.delay = 0;
  this.resultFunction = () => '';
};

MockUrlFetchApp.prototype.fetch = function(url, opt_options) {
  var result = this.result;
  var delay = this.delay;
  console.log('Before sleep')
  if (delay) {
    sleep(delay).wait();
  }
  console.log('After sleep');
  return {
    getContentText: () => this.resultFunction(),
    getResponseCode: () => 200
  };
}

function sleep(ms) {
  var future = new Future;
  setTimeout(function() {
    future.return();
  }, ms);
  return future;
}

module.exports = MockUrlFetchApp;
