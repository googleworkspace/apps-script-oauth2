/**
 * @file Mocks out Apps Script's UrlFetchApp
 */

var MockUrlFetchApp = function() {
  this.resultFunction = () => '';
};

MockUrlFetchApp.prototype.fetch = function(url, optOptions) {
  var result = this.resultFunction(url, optOptions);

  return {
    getContentText: () => result,
    getResponseCode: () => 200
  };
};


module.exports = MockUrlFetchApp;
