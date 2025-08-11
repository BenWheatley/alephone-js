export class DataViewReader {
  constructor(dataView, offset = 0, littleEndian = false) {
    this.dataView = dataView;
    this.offset = offset;
    this.littleEndian = littleEndian;
  }

  seek(pos) {
    this.offset = pos;
  }

  tell() {
    return this.offset;
  }

  skip(bytes) {
    this.offset += bytes;
  }

  readUint8() {
    const val = this.dataView.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readInt16() {
    const val = this.dataView.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return val;
  }
  
  readInt32() {
    const val = this.dataView.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return val;
  }

  readUint16() {
    const val = this.dataView.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return val;
  }

  readUint32() {
    const val = this.dataView.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return val;
  }
  
  // Caution: this presumes you're giving a valid length, your own problem if you don't
  readBytes(length) {
    const bytes = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, length);
    this.offset += length;
    return bytes;
  }

  // Add more methods as needed...
}
