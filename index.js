const { Readable } = require('stream');

function splitBuffer(buffer, index){
  const first = new Buffer(index);
  const second = new Buffer(buffer.length - index);

  buffer.copy(first, 0, 0, index)
  buffer.copy(second, 0, index)
  return { first, second};
}

const MAX_PREV_MEMORY = 30;

class SplitStream extends Readable{

    constructor(readableStream, opts){
      super({ ...opts, objectMode: !opts.explicitRead });
      this.explicitRead = opts.explicitRead || false;
      this.maxPrevMemory = opts.maxPrevMemory || MAX_PREV_MEMORY;
      this.splitAt = opts.splitAt;
      this.buffer = Buffer.alloc(0);
      this.readableStream = readableStream;
      this.togglePause(true);

      this.readableStream.on('end', () => {
        this.finalizing = true;
        this.readNextIntoStream();
      });

      if(!this.explicitRead){
        this.pushAutomatically();
      }
    }

    _read(){}

    createLastStream() {
      const nextLast = new Readable()
      nextLast._read = ()=>{};
      this.last = nextLast;
    }

    removeLastStream() {
      this.last.push(null);
      this.last.ended=true;
    }

    togglePause(value){
      if(!this.explicitRead){
        return;
      }
      if(value){
        this.readableStream.pause();
      } else {
        this.readableStream.resume();
      }
    }

    finalize(){
      this.end=true
      this.removeLastStream();
    }

    readNextIntoStream() {
      if(this.finalizing && this.buffer.length === 0){
        this.finalize();  //if in final stage and nothing more to flush, close streams
      }
      else if(this.buffer.length > this.maxPrevMemory || this.finalizing){
        // find index to split the buffer
        const separatorIndex = this.getIndexOfSplit(this.buffer);
        if(separatorIndex >= 0){
          this.flushSplitted(separatorIndex)
        } else if (!this.finalizing){
          // flush everything except last maxPrevMemory bytes so that in next iteration, the 'getIndexOfSplit' will be
          // called on chunk of data prepended by maxPrevMemory bytes of last chunk, to consider the delimiter in case when
          // its located at ends of 2 consecutive chunks, assuming delimiter length is shorter than maxPrevMemory.
          this.flushExcept(this.maxPrevMemory);
        } else{
          // if in final stage, flush everything
          this.flushExcept(0);
        }
      } else {
        this.loadNext();
      }
    }

    flushSplitted(separatorIndex){
      const { first, second } = splitBuffer(this.buffer, separatorIndex+1);
      this.buffer = second
      this.last.push( first )
      this.removeLastStream();
    }

    flushExcept(len){
      const { first, second } = splitBuffer(this.buffer, this.buffer.length - len);
      this.buffer = second;
      this.last.push(first);
      this.readNextIntoStream();
    }

    loadNext(){
      this.togglePause(false);
      this.readableStream.once('data', (data)=>{
        this.togglePause(true);
        this.buffer = Buffer.concat([this.buffer, data]);
        this.readNextIntoStream();
      })
    }

    // create a common method to get index of split from all possible delimiters (String/Regex/Array<number>)
    createIndexOfSplitMethod(splitAt){
      if(Array.isArray(splitAt)){
        this.getIndexOfSplit = (data)=>{
          for(let i=0; i<data.length - splitAt.length+1; i++){
            let valid=true;
            for(let k=0;k<splitAt.length; k++){
              if(data[i+k] !== splitAt[k]){
                valid=false;
                break;
              }
            }
            if(valid){
              return i + splitAt.length - 1;
            }
          }
          return -1;
        }
      } else if(typeof splitAt === 'function'){
        this.getIndexOfSplit = splitAt;
      } else if( splitAt.constructor.name === "RegExp" ){
        this.getIndexOfSplit = data => {
          const result = data.toString().match(splitAt)
          return result ? result.index + result[0].length - 1  : -1;
        };
      } else if( typeof splitAt === 'string' ){
        this.getIndexOfSplit = data => {
          const index = data.toString().indexOf(splitAt);
          if(index >= 0){
            return index + splitAt.length - 1
          }
          return -1;
        };
      }
    }

    readUntil(splitAt) {
      if(this.last && !this.last.ended){
        throw new Error("CURRENT_STREAM_STILL_RUNNING");
      }
      if(this.end){
        return null;
      }
      this.createIndexOfSplitMethod(splitAt);
      this.createLastStream();
      this.readNextIntoStream();

      return new Promise(resolve => {
        this.last.once('readable', () => {
          if(this.last._readableState.length){
            return resolve(this.last);
          }
          resolve(null);
        })
        this.last.once('end', ()=>{
          resolve(null);
        })
      })
    }

    async pushAutomatically(){
      const rs = await this.readUntil(this.splitAt);
      this.push(rs)
      if(!rs){
        return;
      }
      rs.on("end", ()=>{
        this.pushAutomatically()
      });
    }
}

module.exports = SplitStream;
