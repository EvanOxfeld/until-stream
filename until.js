'use strict';

module.exports = Until;
var PullStream = require('pullstream');
var inherits = require("util").inherits;
var Buffers = require('buffers');

function Until(opts) {
  this._bufs = Buffers();
  PullStream.call(this, opts);
}
inherits(Until, PullStream);

Until.prototype.pullUntil = function (signature, callback) {
  //todo better check
  if (typeof signature === "string") {
    signature = new Buffer(signature);
  }

  var self = this;
  var window = Buffers();
  var output = Buffers();
  var prevData = new Buffer(0);
  pullUntilServiceRequest();

  function pullUntilServiceRequest() {
    //todo chunk size should be an option
    var data = self.pullUpTo(1024);
    if (data) {
      process(data);
    } else {
      self.once('readable', function() {
        data = self.pullUpTo(1024);
        process(data);
      });
    }
  }

  function process(data) {
    window.push(prevData);
    if (data) {
      window.push(data);
    }

    //todo make sure this is always async
    var sigIndex = window.indexOf(signature);
    if (sigIndex >= 0) {
      processSignature(sigIndex);
    } else {
      output.push(prevData);
      prevData = data;
      pullUntilServiceRequest();
    }
  }

  function processSignature(sigIndex) {
    output.push(window.slice(0, sigIndex));
    self._bufs.push(window.slice(sigIndex + signature.length, window.length));
    callback(null, output.toBuffer());
  }
};

Until.prototype.pull = function (len, callback) {
  //todo improve this logic
  if (typeof len === 'function' && !callback) {
    callback = len;
    len = undefined;
  }

  if (!this._bufs.length || len === 0) {
    if (!len) {
      return PullStream.prototype.pull.call(this, callback);
    }
    return PullStream.prototype.pull.call(this, len, callback);
  }

  var self = this;
  pullServiceRequest();

  function pullServiceRequest() {
    self._serviceRequests = null;
    if (self._flushed) {
      return callback(new Error('End of Stream'));
    }

    //todo cleanup -> keying off of len = undefined is not cool
    var data;
    if (self._bufs.length >= len) {
      data = self._bufs.slice(0, len);
      var slice = self._bufs = self._bufs.slice(len, self._bufs.length);
      self._bufs = Buffers();
      self._bufs.push(slice);
    } else if (len) {
      var streamData = self.read(len - self._bufs.length);
      if (streamData) {
        data = Buffer.concat([self._bufs.toBuffer(), streamData]);
        self._bufs = Buffers();
      }
    } else {
      var streamData = self.read();
      if (streamData) {
        data = Buffer.concat([self._bufs.toBuffer(), streamData])
      } else {
        data = self._bufs.toBuffer();
      }
      self._bufs = Buffers();
    }

    if (data) {
      process.nextTick(callback.bind(null, null, data));
    } else {
      self._serviceRequests = pullServiceRequest;
    }
  }
};

Until.prototype.pullUpTo = function (len) {
  if (this._bufs.length >= len) {
    var data = this._bufs.slice(0, len);
    var slice = this._bufs.slice(len, this._bufs.length);
    this._bufs = Buffers();
    this._bufs.push(slice);
    return data;
  }

  var data = PullStream.prototype.pullUpTo.call(this, len - this._bufs.length);
  if (data) {
    data = Buffer.concat([this._bufs.toBuffer(), data]);
  } else if (this._bufs.length) {
    data = this._bufs.toBuffer();
  }
  this._bufs = Buffers();
  return data;
}

Until.prototype._flush = function (outputFn, callback) {
  var self = this;
  if (this._readableState.length > 0 || this._bufs.length) {
    return setImmediate(self._flush.bind(self, outputFn, callback));
  }

  this._flushed = true;
  if (self._writesFinished) {
    self._finish(callback);
  } else {
    callback();
  }
};

//todo prepend _bufs in front of pipe