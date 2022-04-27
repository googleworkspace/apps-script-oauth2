

/**
 * @file Mocks out Apps Script's LockService.Lock. Does not implement correct lock
 * semantics at the moment. Previous versions relied on node-fibers which is now
 * obsolete. It's possible to recreate apps script multi-threaded environment
 * via worker threads and implement proper locking and that may be considered
 * in the future.
 */

var locked = false;

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
    }
  } while (new Date().getTime() - start.getTime() < timeoutInMillis);
  throw new Error('Unable to get lock');
};

MockLock.prototype.releaseLock = function() {
  locked = false;
  this.hasLock_ = false;
};

MockLock.prototype.hasLock = function() {
  return this.hasLock_;
};

module.exports = MockLock;
