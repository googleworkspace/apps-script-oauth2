var MockUrlFetchApp = function() {
  this.delay = 0;
  this.result = '';
};

MockUrlFetchApp.prototype.fetch = function(url, opt_options) {
  var result = this.result;
  var delay = this.delay;
  if (delay) {
    await timeout(delay);
  }
  return {
    getContentText: () => result,
    getResponseCode: () => 200
  };
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = MockUrlFetchApp;
