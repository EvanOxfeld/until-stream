'use strict';

module.exports = Until;
var PassThrough = require('stream').PassThrough;
var inherits = require("util").inherits;
var Buffers = require('buffers');

if (!PassThrough) {
  PassThrough = require('readable-stream/passthrough');
}

inherits(Until, PassThrough);

//todo only emit end when buffer is empty
function Until(opts) {
  this._buf = Buffers();
  this._found = false;

  if (typeof opts.pattern === "string") {
    opts.pattern = new Buffer(opts.pattern);
  } else if (!opts.pattern instanceof Buffer) {
    throw new Error('Invalid pattern type')
  }

  this._opts = opts;
  this.unpiping = false;

  //todo allow and handle normal PassThrough opts
  PassThrough.call(this);
}

Until.prototype.read = function (size) {
  if (this.unpiping) {
    //either return null from read() until everything is unpiped
    //    or override readable-stream.pipe() flow()
    return null;
  }

  if (size && size <= this._buf.length) {
    var data = this._buf.slice(0, size);
    this._buf = Buffers(this._buf.slice(size, this._buf.length));
    return data;
  }

  if (size) {
    size = size - this._buf.length;
  }

  //todo override pipe instead of this hack
  if (size !== null && size !== undefined && !this._readableState.pipeChunkSize) {
    //todo other states that just use PassThrough's read?
    //todo start from buf
    return PassThrough.prototype.read.call(this, size);
  }

  var data = size ? PassThrough.prototype.read.call(this, size) : PassThrough.prototype.read.call(this);
  if (data) {
    var output = this._buf;
    output.push(data);
    var index = output.indexOf(this._opts.pattern);
    if (index === -1 || (this._found && index === 0)) {
      this._found = false;
      //slice off pattern.length - 1 from the end in case the pattern straddles chunks
      var offset = this._readableState.length ? output.length - this._opts.pattern.length + 1 : -1;
      if (offset > 0) {
        this._buf = Buffers([output.slice(offset, output.length)]);
        output = output.slice(0, offset);
      } else {
        output = output.toBuffer();
      }

      return output;
    }

    //lop off everything starting with pattern & put it in buffer for next time
    this._found = true;
    this._buf = Buffers([output.slice(index, output.length)]);
    var result = output.slice(0, index);
    var self = this;
    if (this._readableState.pipesCount) {
      this.unpiping = true;
      process.nextTick(endPipes.bind(this));
    }

    return result;
  } else {
    data = this._buf.toBuffer();
    this._buf = Buffers();
    var output = data.length ? data : null;
    return output;
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
