import crypto from 'crypto'

export function atob(data: string, encoding: BufferEncoding = 'utf8'): string {
  return Buffer.from(data, 'base64').toString(encoding)
}

export function btoa(
  data: string | Buffer,
  encoding: BufferEncoding = 'utf8'
): string {
  if (Buffer.isBuffer(data)) {
    return data.toString('base64')
  } else {
    return Buffer.from(data, encoding).toString('base64')
  }
}

export function encodeJSONRiotLike(data: any): string {
  return JSON.stringify(data, null, '\t').replace(/\n/gi, '\r\n')
}

export function randomItem<T>(array: T[]): T {
  const r = (crypto.randomBytes(2).readUInt16LE() / 2) | 0
  return array[r % array.length]!
}

export const noop = (...args: any[]) => {}
