// https://cs.github.com/electron/node-chromium-pickle-js/blob/master/lib/pickle.js

enum Size {
  Int32 = 4,
  Uint32 = 4,
  Int64 = 8,
  Uint64 = 8,
  Float = 4,
  Double = 8,

  // The allocation granularity of the payload.
  PayloadUnit = 64,
}

// Largest JS number.
const CAPACITY_READ_ONLY = 9007199254740992

// Aligns 'i' by rounding it up to the next multiple of 'alignment'.
const alignInt = (i: number, alignment: number) =>
  i + ((alignment - (i % alignment)) % alignment)

// PickleIterator reads data from a Pickle. The Pickle object must remain valid
// while the PickleIterator object is in use.
export class PickleIterator {
  payload: Buffer
  payloadOffset: number
  readIndex: number
  endIndex: number
  constructor(pickle: Pickle) {
    this.payload = pickle.header
    this.payloadOffset = pickle.headerSize
    this.readIndex = 0
    this.endIndex = pickle.getPayloadSize()
  }
  readBool() {
    return this.readInt() !== 0
  }
  readInt(): number {
    return this.readBytes(Size.Uint32, Buffer.prototype.readUInt32LE)
  }
  readUInt32(): number {
    return this.readBytes(Size.Uint32, Buffer.prototype.readUInt32LE)
  }
  readInt64(): bigint {
    return this.readBytes(Size.Int64, Buffer.prototype.readInt64LE)
  }
  readUInt64(): bigint {
    return this.readBytes(Size.Uint64, Buffer.prototype.readUInt64LE)
  }
  readFloat(): number {
    return this.readBytes(Size.Float, Buffer.prototype.readFloatLE)
  }
  readDouble(): number {
    return this.readBytes(Size.Double, Buffer.prototype.readDoubleLE)
  }
  readString(): string {
    return this.readBytesRaw(this.readInt()).toString()
  }
  readBytes<T extends (this: Buffer, offset?: number) => number | bigint>(
    length: number,
    method: T
  ): ReturnType<T> {
    let readPayloadOffset = this.getReadPayloadOffsetAndAdvance(length)
    return method.call(this.payload, readPayloadOffset, length)
  }
  readBytesRaw(length: number) {
    let readPayloadOffset = this.getReadPayloadOffsetAndAdvance(length)
    return this.payload.slice(readPayloadOffset, readPayloadOffset + length)
  }
  getReadPayloadOffsetAndAdvance(length: number) {
    if (length > this.endIndex - this.readIndex) {
      this.readIndex = this.endIndex
      throw new Error('Failed to read data with length of ' + length)
    }
    let readPayloadOffset = this.payloadOffset + this.readIndex
    this.advance(length)
    return readPayloadOffset
  }
  advance(size: number) {
    let alignedSize = alignInt(size, Size.Uint32)
    if (this.endIndex - this.readIndex < alignedSize) {
      this.readIndex = this.endIndex
    } else {
      this.readIndex += alignedSize
    }
  }
}

// This class provides facilities for basic binary value packing and unpacking.
//
// The Pickle class supports appending primitive values (ints, strings, etc.)
// to a pickle instance.  The Pickle instance grows its internal memory buffer
// dynamically to hold the sequence of primitive values.   The internal memory
// buffer is exposed as the "data" of the Pickle.  This "data" can be passed
// to a Pickle object to initialize it for reading.
//
// When reading from a Pickle object, it is important for the consumer to know
// what value types to read and in what order to read them as the Pickle does
// not keep track of the type of data written to it.
//
// The Pickle's data has a header which contains the size of the Pickle's
// payload.  It can optionally support additional space in the header.  That
// space is controlled by the header_size parameter passed to the Pickle
// constructor.
export class Pickle {
  header: Buffer
  headerSize: number
  capacityAfterHeader: number
  writeOffset: number
  constructor(buffer?: Buffer) {
    if (!buffer) {
      this.initEmpty()
    } else {
      this.initFromBuffer(buffer)
    }
  }

  initEmpty() {
    this.header = Buffer.alloc(0)
    this.headerSize = Size.Uint32
    this.capacityAfterHeader = 0
    this.writeOffset = 0
    this.resize(Size.PayloadUnit)
    this.setPayloadSize(0)
  }
  initFromBuffer(buffer: Buffer) {
    this.header = buffer
    this.headerSize = buffer.length - this.getPayloadSize()
    this.capacityAfterHeader = CAPACITY_READ_ONLY
    this.writeOffset = 0
    if (this.headerSize > buffer.length) {
      this.headerSize = 0
    }
    if (this.headerSize !== alignInt(this.headerSize, Size.Uint32)) {
      this.headerSize = 0
    }
    if (this.headerSize === 0) {
      this.header = Buffer.alloc(0)
    }
  }
  createIterator() {
    return new PickleIterator(this)
  }
  toBuffer() {
    return this.header.slice(0, this.headerSize + this.getPayloadSize())
  }
  setPayloadSize(payloadSize: number) {
    this.header.writeUInt32LE(payloadSize, 0)
  }
  getPayloadSize() {
    return this.header.readUInt32LE(0)
  }
  resize(newCapacity: number) {
    newCapacity = alignInt(newCapacity, Size.PayloadUnit)
    this.header = Buffer.concat([this.header, Buffer.allocUnsafe(newCapacity)])
    this.capacityAfterHeader = newCapacity
  }
}
