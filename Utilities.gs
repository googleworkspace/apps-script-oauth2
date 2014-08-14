// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Contains utility methods used by the library.
 */

/**
 * Builds a complete URL from a base URL and a map of URL parameters.
 * @param {string} url The base URL.
 * @param {Object.<string, string>} params The URL parameters and values.
 * @returns {string} The complete URL.
 * @private
 */
function buildUrl_(url, params) {
  var paramString = Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + paramString;
}

/**
 * Validates that all of the values in the object are non-empty. If an empty value is found,
 * and error is thrown using the key as the name.
 * @param {Object.<string, string>} params The values to validate.
 * @private
 */
function validate_(params) {
  Object.keys(params).forEach(function(name) {
    var value = params[name];
    if (isEmpty_(value)) {
      throw Utilities.formatString('%s is required.', name);
    }
  });
}

/**
 * Returns true if the given value is empty, false otherwise. An empty value is one of
 * null, undefined, a zero-length string, a zero-length array or an object with no keys.
 * @param {?} value The value to test.
 * @returns {boolean} True if the value is empty, false otherwise.
 * @private
 */
function isEmpty_(value) {
  return value == null || value == undefined ||
      ((_.isObject(value) || _.isString(value)) && _.isEmpty(value));
}

/**
 * Gets the current time in seconds, rounded down to the nearest second.
 * @private
 */
function getTimeInSeconds_() {
  return Math.floor(new Date().getTime() / 1000);
}
