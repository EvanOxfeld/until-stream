var UntilStream = require('../');
var streamBuffers = require("stream-buffers");

var us = new UntilStream({ pattern: 'jumps'});

var sourceStream = new streamBuffers.ReadableStreamBuffer({
  chunkSize: 8
});
sourceStream.put("The quick brown fox jumps over the lazy dog");

sourceStream.pipe(us);

var beforePattern = "";
us.on('readable', function() {
  var data = us.read();
  if (data) {
    if (data.toString().indexOf('jumps') === 0) {
      console.log('Match!');
      console.log('Data before pattern:', "'" + beforePattern + "'");
      console.log('Next call to read() starts with pattern:', "'" + data.toString() + "'");
      process.exit(0);
    } else {
      beforePattern += data.toString();
    }
  }
});

//Output
//Data before pattern: 'The quick brown fox '
//Next call to read() starts with pattern: 'jumps over the l'