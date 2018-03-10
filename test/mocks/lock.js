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
};

MockLock.prototype.waitLock = function(timeoutInMillis) {
  var start = new Date();
  do {
    if (!locked || this.hasLock_) {
      locked = true;
      this.hasLock_ = true;
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
