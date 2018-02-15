var Fiber = require('fibers');

var locked = false;
var waitingFibers = [];

var MockLock = function() {
  this.gotLock = false;
  this.id = Math.random();
};

MockLock.prototype.waitLock = function(timeoutInMillis) {
  var start = new Date();
  do {
    if (!locked || this.gotLock) {
      locked = true;
      this.gotLock = true;
      return;
    } else {
      waitingFibers.push(Fiber.current);
      Fiber.yield();
    }
  } while (timeDiffInMillis(new Date(), start) < timeoutInMillis);
  throw new Error('Unable to get lock');
};

MockLock.prototype.releaseLock = function() {
  locked = false;
  this.gotLock = false;
  if (waitingFibers.length) {
    waitingFibers.pop().run();
  }
};

MockLock.prototype.hasLock = function() {
  return this.gotLock;
};

function timeDiffInMillis(a, b) {
  return a.getTime() - b.getTime();
}

module.exports = MockLock;
