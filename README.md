# graphql-db-projection

Split a stream into multiple streams by defining flexible delimiter of delimiting function that returns index of separation.
<br/>Each new resulting substream starts when previous ends.
<br/>There are 2 ways to do this: stream of streams or explicit function receives delimiter and returns stream that ends at that delimiter or when nothing left in main stream.

### First way: (stream of streams)

```js

```

### Second way: (explicit function)

```js

```
