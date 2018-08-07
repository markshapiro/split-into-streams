const { createReadStream, createWriteStream } = require('fs');
const { spawn } = require('child_process');

const SplitStream = require('../../index')

const file = createReadStream('./pdf.pdf')
const child = spawn('pdftoppm', `-r 40 -f 1 -l 5 -jpeg -`.split(' ') );

file.pipe(child.stdin)

const rs = new SplitStream(child.stdout, { explicitRead: true })

run(rs)

let i=0;

async function run(rs){
  const stream = await rs.readUntil([255, 217]);  // 255, 217 is ending of jpeg
  if(!stream){
    console.log("Finished")
    return;
  }
  const ws = createWriteStream(`./img${i++}.jpeg`)
  stream.pipe(ws)
  stream.on("end", ()=>{
    run(rs)
  });
}
