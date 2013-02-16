'use strict';

module.exports = Until;
var PassThrough = require('stream').PassThrough;
var inherits = require("util").inherits;
require('bufferjs');

if (!PassThrough) {
  PassThrough = require('readable-stream/passthrough');
}

inherits(Until, PassThrough);

//todo only emit end when buffer is empty
function Until(opts) {
  this._buf = null;

  if (typeof opts.pattern === "string") {
    opts.pattern = new Buffer(opts.pattern);
  }
  this._opts = opts;
  this.unpiping = false;

  PassThrough.call(this);
}

//todo buffer between chunks
Until.prototype.read = function (size) {
  if (this.unpiping) {
    //either return null from read() until everything is unpiped
    //    or override readable-stream.pipe() flow()
    return null;
  }

  if (size) {
    //todo start from buf
    return PassThrough.prototype.read.call(this, size);
  }

  var data = PassThrough.prototype.read.call(this);
  if (data) {
    var index = data.indexOf(this._opts.pattern);
    if (index === -1) {
      return data;
    }

    //lop off everything starting with pattern & put it in buffer for next time
    this._buf = data.slice(index, data.length);
    var result = data.slice(0, index)
    var self = this;
    if (this._readableState.pipesCount) {
      this.unpiping = true;
      process.nextTick(endPipes.bind(this));
    }

    return result;
  } else {
    data = this._buf;
    this._buf = null;
    return data;
  }

  function endPipes() {
    var pipes = this._readableState.pipes;
    var pipesCount = this._readableState.pipesCount;
    self.unpipe();
    self.unpiping = false;

    switch (pipesCount) {
    case 1:
      pipes.end();
      break;
    default:
      //todo
      break;
    }
  }
};
