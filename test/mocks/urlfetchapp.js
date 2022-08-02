/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file Mocks out Apps Script's UrlFetchApp.
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
