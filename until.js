'use strict';

module.exports = Until;
var PullStream = require('pullstream');
var inherits = require("util").inherits;
var over = require('over');
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
    //todo less naive solution to wait until there's data
    if (!data) {
      self.pull(16, function(err, data) {
        if (err) {
          //todo this should be more async
          return callback(err);
        }
        process(data);
      })
    }
    process(data);
  }

  function process(data) {
//    console.log('rs', self._readableState)
    window.push(prevData);
    if (data) {
      window.push(data);
    }

    //todo make sure this is always async
    var sigIndex = window.indexOf(signature);
    if (prevData.length && sigIndex <= 0) {
      output.push(prevData);
      prevData = data;
      pullUntilServiceRequest();
    } else if (!prevData.length) {
      pullUntilServiceRequest();
    } else {
      processSignature(sigIndex);
    }
  }

  function processSignature(sigIndex) {
    console.log('process Sig')
    output.push(window.slice(0, sigIndex));
    self.prepend(window.slice(sigIndex, window.length))
    callback(null, output.toBuffer());
  }
};

//todo rework prepend call. Unlikely to remain in API
Until.prototype.prepend = function (chunk) {
  this._bufs.push(chunk);
};

Until.prototype.pull = over([
  [over.numberOptionalWithDefault(null), over.func, function (len, callback) {
    if (!this._bufs.length || len === 0) {
      return PullStream.prototype.pull.call(this, len, callback);
    }

    var self = this;
    pullServiceRequest();

    function pullServiceRequest() {
      self._serviceRequests = null;
      if (self._flushed) {
        return callback(new Error('End of Stream'));
      }

      var data;
      if (self._bufs.length >= len) {
        data = self._bufs.slice(0, len);
        var slice = self._bufs = self._bufs.slice(len, self._bufs.length);
        self._bufs = Buffers();
        self._bufs.push(slice);
      } else {
        var streamData = self.read(len - self._bufs.length);
        if (streamData) {
          data = Buffer.concat([self._bufs.toBuffer(), streamData])
          self._bufs = Buffers();
        }
      }

      if (data) {
        process.nextTick(callback.bind(null, null, data));
      } else {
        self._serviceRequests = pullServiceRequest;
      }
    }
  }]
]);

//todo pullUpTo(null) should return internal buffer plus any bytes within the stream
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
  } else {
    data = this._bufs.toBuffer();
  }
  this._bufs = Buffers();
  return data;
}

//todo prepend _bufs in front of pipe