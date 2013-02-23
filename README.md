until-stream [![Build Status](https://travis-ci.org/EvanOxfeld/until-stream.png)](https://travis-ci.org/EvanOxfeld/until-stream)
============

Ever wanted to pause a stream when a certain String or
a binary signature is reached? Until-Stream is the
answer. Pipe Until-Stream and automatically stop when
your pattern is reached or call read() until the returned
data matches your pattern. 

<pre>
--------------------------------------
|Stability - API is somewhat unstable|
--------------------------------------
</pre>
read() and pipe() are implemented with some limitations.
For example, Until-Stream supports piping to only a
single destination stream.

## Installation

```bash
$ npm install until-stream
```

## Quick Examples

### Pipe

```javascript
var UntilStream = require('until-stream');
var streamBuffers = require("stream-buffers");

var us = new UntilStream({ pattern: 'World'});

var sourceStream = new streamBuffers.ReadableStreamBuffer();
sourceStream.put("Hello World");
var writableStream = new streamBuffers.WritableStreamBuffer();

sourceStream.pipe(us).pipe(writableStream);

writableStream.once('close', function () {
  //writeableStream contains all data before the pattern occurs
  var str = writableStream.getContentsAsString('utf8'); // 'Hello '
  //Now the next call to read() returns the pattern
  var data = us.read(); // 'World'
});
```
### Read

```javascript
var UntilStream = require('until-stream');
var streamBuffers = require("stream-buffers");

var us = new UntilStream({ pattern: 'jumps'});

var sourceStream = new streamBuffers.ReadableStreamBuffer({ chunkSize: 8 });
sourceStream.put("The quick brown fox jumps over the lazy dog");

sourceStream.pipe(us);

us.on('readable', function() {
  if (us.read() === 'jumps') {
    console.log('Pattern reached!');
  }
});
```

## License

MIT

