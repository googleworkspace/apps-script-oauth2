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

var MockCache = function(optCache) {
  this.store = optCache || {};
  this.counter = 0;
};

MockCache.prototype.get = function(key) {
  ++this.counter;
  return this.store[key];
};

MockCache.prototype.put = function(key, value) {
  this.store[key] = value;
};

MockCache.prototype.remove = function(key) {
  delete this.store[key];
};

module.exports = MockCache;
