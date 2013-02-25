var test = require('tap').test;
var streamBuffers = require("stream-buffers");
var UntilStream = require('../');

test("set pattern after the fact", function (t) {
  t.plan(4);
  var us = new UntilStream();

  var sourceStream = new streamBuffers.ReadableStreamBuffer();
  sourceStream.put("The quick brown fox jumps over the lazy dog");

  us.on('finish', function () {
    sourceStream.destroy();
    us.setPattern('jumps');
    var writableStream = new streamBuffers.WritableStreamBuffer();
    us.pipe(writableStream);
    writableStream.on('close', function () {
      var str = writableStream.getContentsAsString('utf8');
      t.equal(str, 'The quick brown fox ');
      var data = us.read();
      t.equal(data.toString(), 'jumps');
      data = us.read();
      t.equal(data.toString(), ' over the lazy');
      data = us.read();
      t.equal(data.toString(), ' dog');
      t.end();
    });
  });

  sourceStream.pipe(us);
});