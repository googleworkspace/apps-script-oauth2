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
