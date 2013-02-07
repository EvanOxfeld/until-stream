'use strict';

var test = require('tap').test;
var streamBuffers = require("stream-buffers");
var UntilStream = require('../');

test("pullUntil", function (t) {
  t.plan(2);
  var us = new UntilStream();
  us.on('finish', function () {
    sourceStream.destroy();
  });

  var sourceStream = new streamBuffers.ReadableStreamBuffer({
    frequency: 0,
    chunkSize: 1000
  });
  sourceStream.put("Hello World!");

  sourceStream.pipe(us);

  us.pullUntil(' World', function(err, data) {
    if (err) {
      throw err;
    }
    t.equal('Hello', data.toString());
    us.pull(function (err, data) {
      if (err) {
        throw err;
      }
      t.equal('!', data.toString());
      t.end();
    });
  });
});

/*test("pipeUntil", function (t) {
  t.plan(2);
  var us = new UntilStream();
  us.on('finish', function () {
    sourceStream.destroy();
  });

  var sourceStream = new streamBuffers.ReadableStreamBuffer({
    frequency: 0,
    chunkSize: 1000
  });
  sourceStream.put("Hello World!");

  var writableStream = new streamBuffers.WritableStreamBuffer({
    initialSize: 100
  });

  writableStream.on('close', function () {
    var str = writableStream.getContentsAsString('utf8');
    t.equal('Hello', str);

    us.pull(function (err, data) {
      if (err) {
        throw err;
      }
      t.equal('!', data.toString());
      return t.end();
    });
  });

  sourceStream.pipe(us).pipe(writableStream, { until: ' World'}).pipe(writableStream);
});*/


/*
test("source sending twelve bytes at once", function (t) {
  t.plan(3);
  var ps = new UntilStream({ lowWaterMark : 0 });
  ps.on('finish', function () {
    sourceStream.destroy();
  });

  var sourceStream = new streamBuffers.ReadableStreamBuffer({
    frequency: 0,
    chunkSize: 1000
  });
  sourceStream.put("Hello World!");

  sourceStream.pipe(ps);

  ps.pull('Hello'.length, function (err, data) {
    if (err) {
      throw err;
    }
    t.equal('Hello', data.toString());

    var writableStream = new streamBuffers.WritableStreamBuffer({
      initialSize: 100
    });
    writableStream.on('close', function () {
      var str = writableStream.getContentsAsString('utf8');
      t.equal(' World', str);

      ps.pull(function (err, data) {
        if (err) {
          throw err;
        }
        t.equal('!', data.toString());
        return t.end();
      });
    });

    ps.pipe(' World'.length, writableStream);
  });
});*/
