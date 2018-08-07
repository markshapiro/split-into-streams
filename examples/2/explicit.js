const { createReadStream } = require('fs');
const { spawn } = require('child_process');

const SplitStream = require('../../index')

const file = createReadStream('./text.txt')

const rs = new SplitStream(file, { explicitRead: true })

run(rs)

async function run(rs){
  // const stream = rs.readUntil(/\n/);
  // const stream = rs.readUntil('\n');
  const stream = await rs.readUntil([10])
  if(!stream){
    console.log("Finished")
    return;
  }
  stream.on("data", data=>{
    console.log("DATA: ", data.toString())
  });
  stream.on("end", ()=>{
    run(rs)
  });
}
