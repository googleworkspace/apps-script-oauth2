var locked = false;

var MockLock = function() {
  this.hasLock = false;
};

MockCache.prototype.waitLock = function(timeoutInMillis) {
  var start = new Date();
  do {
    if (!locked) {
      locked = true;
      this.hasLock = true;
      return;
    }
  } while (timeDiffInMillis(new Date(), start) > timeoutInMillis);
  throw new Error('Unable to get lock');
};

MockCache.prototype.releaseLock = function() {
  if (!this.hasLock) {
    throw new Error('Not your lock');
  }
  locked = false;
  this.hasLock = false;
};

function timeDiffInMillis(a, b) {
  return a.getTime() - b.getTime();
}

module.exports = MockCache;
