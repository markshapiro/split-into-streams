# split-into-streams

Split a stream into multiple streams by defining flexible delimiter or a delimiting function that returns index of separation, given a chunk of next read data, Each new resulting substream starts when the reading of previous is finished.
<br/>There are 2 methods: stream of streams or explicit function that receives delimiter of where the stream ends.

### First way: (stream of streams)

```js
const rs = new SplitStream(readableStream, {
  explicitRead: false,  // set as non explicit
  splitAt: '\n',        // split at newline
})
rs.on('data',  stream => {
  // this stream will end at next line break (including delimiter)
  stream.on("data", data => { ... })
});
```

### Second way: (explicit function)

```js
const rs = new SplitStream(readableStream, {
  explicitRead: true,   // set as explicit
})
const stream = await rs.readUntil('\n');
// received stream will end at next line break (including delimiter)
stream.on("data", data => { ... })
```
NOTE: this method will automatically pause the given stream on creation, and resume & pause when reading each next chunk, this  will force the main stream to stay until everything is read when we read from stdout of spawn process for example.

### Options

#### explicitRead
default: false

to specify one of two ways above

#### splitAt / or as argument of `readUntil()`
mandatory field

the delimiter value that should separate streams, can be string, regex, array of numbers or function that returns point of separation.
- when string, will separate at place where toString() values of bytes in buffer match the string.
- when regex, will separate at place where toString() values of bytes in buffer match the regex.
- when array of numbers, will spearate at place where bytes match the values.
- when function, will call that function on chunk of data and expect an index of separation to be returned.
<br/>example: to separate after line break, you can pass `'\n'`, `/\n/`, `[10]`, or provide function:
```js
(nextChunkData) => nextChunkData.toString().indexOf('\n')
```
to separate before the delimiter, simply decrease the index offset:
```js
(nextChunkData) => nextChunkData.toString().indexOf('\n') - 1
```

