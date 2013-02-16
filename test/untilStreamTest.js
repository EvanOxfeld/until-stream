'use strict';

var test = require('tap').test;
var streamBuffers = require("stream-buffers");
var UntilStream = require('../');

test("read until pattern", function (t) {
  t.plan(2);
  var us = new UntilStream({ pattern: ' World'});
  us.on('finish', function () {
    sourceStream.destroy();
  });

  var sourceStream = new streamBuffers.ReadableStreamBuffer({
    frequency: 0,
    chunkSize: 1000
  });
  sourceStream.put("Hello World!");

  sourceStream.pipe(us);

  us.once('readable', function() {
    var data = us.read();
    t.equal(data.toString(), 'Hello');
    data = us.read();
    t.equal(data.toString(), ' World!');
    t.end();
  });
});

test("pipe until pattern", function (t) {
  t.plan(2);
  var us = new UntilStream({ pattern: ' World'});
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
    t.equal(str, 'Hello');
    var data = us.read();
    t.equal(data.toString(), ' World!');
    t.end();
  });

  sourceStream.pipe(us).pipe(writableStream);
});

//todo pipe until pattern divided between chunks
