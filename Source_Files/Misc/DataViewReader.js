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
  
  // TODO: test this actually writes as expected
  writeBytes(bytes, count) {
    // Create a Uint8Array view into the same buffer that dataView uses,
    // starting at the current offset.
    const dest = new Uint8Array(
      this.dataView.buffer,
      this.dataView.byteOffset + this.offset,
      count
    );
    
    // Bulk copy from source bytes into target
    dest.set(bytes.subarray(0, count));
    
    this.offset += count;
  }
  
  byteLength() {
    return this.dataView.byteLength;
  }

  // Add more methods as needed...
}
