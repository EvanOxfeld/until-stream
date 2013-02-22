var UntilStream = require('../');
var streamBuffers = require("stream-buffers");

var us = new UntilStream({ pattern: ' World'});

var sourceStream = new streamBuffers.ReadableStreamBuffer({ chunkSize: 1000 });
sourceStream.put("Hello World!");
us.on('finish', function () {
  sourceStream.destroy();
});

var writableStream = new streamBuffers.WritableStreamBuffer();

sourceStream.pipe(us).pipe(writableStream);

writableStream.once('close', function () {
  var str = writableStream.getContentsAsString('utf8'); //Hello
  console.log('Piped data before pattern occurs:', "'" + str + "'");
  var data = us.read(); // World
  console.log('Next call to read() returns the pattern:', "'" + data.toString() + "'");
});

//Output
//Piped data before pattern occurs: 'Hello'
//Next call to read() returns the pattern: ' World'