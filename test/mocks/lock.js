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
 * @file Mocks out Apps Script's LockService.Lock, using the fibers library to
 * emulate concurrent executions. Like Apps Script's locks, only one execution
 * can hold the lock at a time.
 */

var Fiber = require('fibers');

var locked = false;
var waitingFibers = [];

var MockLock = function() {
  this.hasLock_ = false;
  this.id = Math.random();
  this.counter = 0;
};

MockLock.prototype.waitLock = function(timeoutInMillis) {
  var start = new Date();
  do {
    if (!locked || this.hasLock_) {
      locked = true;
      this.hasLock_ = true;
      this.counter++;
      return;
    } else {
      waitingFibers.push(Fiber.current);
      Fiber.yield();
    }
  } while (new Date().getTime() - start.getTime() < timeoutInMillis);
  throw new Error('Unable to get lock');
};

MockLock.prototype.releaseLock = function() {
  locked = false;
  this.hasLock_ = false;
  if (waitingFibers.length) {
    waitingFibers.pop().run();
  }
};

MockLock.prototype.hasLock = function() {
  return this.hasLock_;
};

module.exports = MockLock;
