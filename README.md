# split-into-streams

Split a stream into multiple streams by defining flexible delimiter or a delimiting function that returns index of separation, given a chunk of next read data, Each new resulting substream starts when the reading of previous is finished.
<br/>There are 2 methods: stream of streams or explicit function that receives delimiter of where the stream ends.

## Installation

```bash
$ yarn add split-into-streams
```

```bash
$ npm i split-into-streams
```

### First way: (stream of streams)

```js
const SplitStream = require('split-into-streams');

const rs = new SplitStream(readableStream, {
  explicitRead: false,  // set as non explicit
  splitAt: '\n',        // split at newline
})
rs.on('data', stream => {
  // this stream will end at next line break (including delimiter)
  stream.on("data", data => { ... })
});
```

### Second way: (explicit function)

```js
const SplitStream = require('split-into-streams');

const rs = new SplitStream(readableStream, {
  explicitRead: true,   // set as explicit
})
const stream = await rs.readUntil('\n');
// received stream will end at next line break (including delimiter)
stream.on("data", data => { ... })
```
With this method you can also provide different delimiter to each next `readUntil()`.

NOTE: this method will automatically pause the given stream on creation, and resume & pause when reading each next chunk, this  will force the main stream to stay until everything is read when we read from stdout of spawn process for example.

### Options

#### explicitRead
default: false

To specify one of two ways above

#### splitAt / or as argument to `readUntil()`
mandatory field

The delimiter value that should separate streams, can be string, regex, array of numbers or function that returns point of separation.
- when string, will separate at place where toString() values of bytes in buffer match the string.
- when regex, will separate at place where toString() values of bytes in buffer match the regex.
- when array of numbers, will spearate at place where bytes match the values.
- when function, will call that function on chunk of data and expect an index of separation to be returned.

example: to separate immediately after line break, you can pass `'\n'`, `/\n/`, `[10]`, or provide function:
```js
splitAt: nextChunkData => nextChunkData.toString().indexOf('\n')
```
to separate before the delimiter, simply decrease by 1 position:
```js
splitAt: nextChunkData => nextChunkData.toString().indexOf('\n') - 1
```
to split next stream by different delimiter than the first, you can make counter inside this function and provide different implementation on second call, return -1 if you dont want to split yet and continue passing chunks to currently read substream.

#### maxPrevMemory
default: 30

Sometimes long delimiters can begin at end of one chunk (that is read internally) and end at start of next, in order to consider these the library doesn't push the entire chunk into substream after its read from main stream, but rather leaves out some bytes at the end, to be pushed before next chunk. The length of that ending is defined by `maxPrevMemory`.
<br/>Use this if you are dealing with fairly long delimiters and set it to be the max possible length of your delimiter.
