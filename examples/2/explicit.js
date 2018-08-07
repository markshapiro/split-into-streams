const { createReadStream } = require('fs');
const { spawn } = require('child_process');

const SplitStream = require('../../index')

const file = createReadStream('./text.txt')

const rs = new SplitStream(file, {
  explicitRead: false,
  // splitAt: /\n/,
  // splitAt: '\n',
  splitAt: [10]
})
rs.on('data', stream=>{
  console.log("new substream")
  stream.on('data', data=>{
    console.log("DATA: ", data.toString())
  });
  stream.on('end', data=>{
  });
});
rs.on('end', ()=>{
  console.log("Finished")
});
