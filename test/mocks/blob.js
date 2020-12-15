var MockBlob = function(buffer) {
  this.buffer = buffer;
};

MockBlob.prototype.getDataAsString = function() {
  return this.buffer.toString();
};

module.exports = MockBlob;
