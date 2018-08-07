# split-into-streams

Split a stream into multiple streams by defining flexible delimiter or a delimiting function that returns index of separation, given a chunk of next read data.
<br/>Each new resulting substream starts when previous ends.
<br/>There are 2 ways to do this: stream of streams or explicit function that receives delimiter of where the stream ends.

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
// receives stream will end at next line break (including delimiter)
stream.on("data", data => { ... })
```
