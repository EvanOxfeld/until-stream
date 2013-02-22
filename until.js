'use strict';

module.exports = Until;
var PassThrough = require('stream').PassThrough;
var inherits = require("util").inherits;
var Buffers = require('buffers');

if (!PassThrough) {
  PassThrough = require('readable-stream/passthrough');
}

inherits(Until, PassThrough);

function Until(opts) {
  this._buf = Buffers();
  this._matched = false;

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

Until.prototype._flush = function(output, cb) {
  if (!this._readableState.length) {
    endPipes.call(this, this._buf.toBuffer());
  }
  cb();
}

Until.prototype.read = function (size) {
  if (this.unpiping) {
    //either return null from read() until everything is unpiped
    //    or change flow() within readable-stream.pipe()
    return null;
  }

  var pattern = this._opts.pattern;
  var bufLength = this._buf.length;
  if (this._matched || this._buf.indexOf(pattern) === 0
    || this._buf.push(PassThrough.prototype.read.call(this, size) || new Buffer(0))
        && this._buf.indexOf(pattern) === 0) {
    if (this._readableState.pipesCount && !this.unpiping) {
      this.unpiping = true;
      endPipes.call(this);
      return null;
    }
    this._matched = false;
    var output = this._buf.slice(0, pattern.length);
    var newBuf = Buffers([this._buf.slice(pattern.length)]);
    this._buf = newBuf;
    return output;
  }

  if (bufLength && bufLength === this._buf.length && !this._readableState.pipesCount) {
    var output = this._buf.toBuffer();
    this._buf = Buffers();
    return output;
  }

  var index = this._buf.indexOf(pattern);
  if (index > 0) {
    //lop off everything starting with pattern & put it in buffer for next time
    this._matched = true;
    var output = this._buf.slice(0, index);
    this._buf = Buffers([this._buf.slice(index)]);
    var self = this;
    if (this._readableState.pipesCount) {
      this.unpiping = true;
      process.nextTick(endPipes.bind(this));
    }
    return output;
  }

  //slice off pattern.length - 1 from the end in case the pattern straddles chunks
  var offset = this._buf.length - pattern.length + 1;
  var output = this._buf.slice(0, offset);
  output = output.length ? output : null;
  this._buf = offset > 0 ? Buffers([this._buf.slice(offset)]) : this._buf;
  return output;
};

function endPipes(data) {
  var pipes = this._readableState.pipes;
  var pipesCount = this._readableState.pipesCount;
  this.unpipe();
  this.unpiping = false;


  switch (pipesCount) {
    case 0:
      //no pipes to end
      break;
    case 1:
      pipes.end(data || "");
      break;
    default:
      //todo
      break;
    }
}

Until.prototype.pipe = function(dest, pipeOpts) {
  pipeOpts = pipeOpts || {};
  pipeOpts.end = pipeOpts.end || false;
  return PassThrough.prototype.pipe.call(this, dest, pipeOpts)
};
