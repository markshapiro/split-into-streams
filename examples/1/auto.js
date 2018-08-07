const { createReadStream, createWriteStream } = require('fs');
const { spawn } = require('child_process');

const SplitStream = require('../../index')

const file = createReadStream('./pdf.pdf')
const child = spawn('pdftoppm', `-r 40 -f 1 -l 5 -jpeg -`.split(' ') );

file.pipe(child.stdin)

const rs = new SplitStream(child.stdout, {
	explicitRead: false,
	splitAt: [255, 217],	 // 255, 217 is ending of jpeg
})
let i=0;
rs.on('data', stream=>{
  const ws = createWriteStream(`./img${i++}.jpeg`)
  stream.pipe(ws)
});
rs.on('end', ()=>{
  console.log("Finished")
});
