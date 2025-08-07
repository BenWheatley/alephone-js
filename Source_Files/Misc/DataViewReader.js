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

  // Add more methods as needed...
}
