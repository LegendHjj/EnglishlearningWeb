// Our portable packs use ZIP_STORED: read one entry at a time, never unzip the whole library into RAM.
export interface ZipEntry { name: string; size: number; read(): Promise<ArrayBuffer> }
const invalid = () => new Error('Choose a valid stored ZIP voice pack generated for Fluency Reset.')
const decoder = new TextDecoder('utf-8', { fatal: true })
const checkExtra = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let cursor = 0
  while (cursor < bytes.length) {
    if (cursor + 4 > bytes.length || view.getUint16(cursor, true) === 1) throw invalid()
    cursor += 4 + view.getUint16(cursor + 2, true)
    if (cursor > bytes.length) throw invalid()
  }
}

export async function readVoiceZip(file: Blob): Promise<Map<string, ZipEntry>> {
  if (file.size < 22 || file.size > 2 * 1024 ** 3) throw invalid()
  const tailStart = Math.max(0, file.size - 65557)
  const tail = new DataView(await file.slice(tailStart).arrayBuffer())
  let end = -1
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50 && i + 22 + tail.getUint16(i + 20, true) === tail.byteLength) { end = i; break }
  }
  if (end < 0) throw invalid()
  const count = tail.getUint16(end + 10, true), directorySize = tail.getUint32(end + 12, true), directoryStart = tail.getUint32(end + 16, true)
  if (tail.getUint16(end + 4, true) || tail.getUint16(end + 6, true) || tail.getUint16(end + 8, true) !== count || !count || count > 16050 || directorySize > 8 * 1024 ** 2 || directoryStart + directorySize !== tailStart + end) throw invalid()
  const directory = new Uint8Array(await file.slice(directoryStart, directoryStart + directorySize).arrayBuffer())
  const view = new DataView(directory.buffer), entries = new Map<string, ZipEntry>(), offsets = new Set<number>()
  const ranges: { offset: number; minimumEnd: number }[] = [], boundaries = new Map<number, number>()
  let cursor = 0
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > directory.length || view.getUint32(cursor, true) !== 0x02014b50) throw invalid()
    const flags = view.getUint16(cursor + 8, true), method = view.getUint16(cursor + 10, true)
    const compressed = view.getUint32(cursor + 20, true), size = view.getUint32(cursor + 24, true)
    const nameLength = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true), offset = view.getUint32(cursor + 42, true)
    const next = cursor + 46 + nameLength + extra + comment
    if ((flags & ~0x800) || method !== 0 || compressed !== size) throw new Error('This voice pack uses unsupported ZIP compression. Choose the original stored ZIP.')
    if (view.getUint16(cursor + 6, true) >= 45 || next > directory.length || !nameLength || size > 32 * 1024 ** 2 || view.getUint16(cursor + 34, true) || offset + 30 + nameLength + size > directoryStart) throw invalid()
    checkExtra(directory.subarray(cursor + 46 + nameLength, cursor + 46 + nameLength + extra))
    const name = decoder.decode(directory.subarray(cursor + 46, cursor + 46 + nameLength))
    if (name.startsWith('/') || name.includes('\\') || name.split('/').some(part => part === '..' || part === '.') || name.includes('\0')) throw invalid()
    if (entries.has(name) || offsets.has(offset)) throw new Error('This ZIP contains duplicate entries.')
    offsets.add(offset)
    ranges.push({ offset, minimumEnd: offset + 30 + nameLength + size })
    entries.set(name, { name, size, async read() {
      const header = new DataView(await file.slice(offset, offset + 30).arrayBuffer())
      if (header.byteLength !== 30 || header.getUint32(0, true) !== 0x04034b50 || header.getUint16(4, true) >= 45 || header.getUint16(6, true) !== flags || header.getUint16(8, true) !== method || header.getUint32(18, true) !== size || header.getUint32(22, true) !== size || header.getUint16(26, true) !== nameLength) throw invalid()
      const dataStart = offset + 30 + nameLength + header.getUint16(28, true)
      if (dataStart + size > (boundaries.get(offset) ?? directoryStart) || decoder.decode(await file.slice(offset + 30, offset + 30 + nameLength).arrayBuffer()) !== name) throw invalid()
      checkExtra(new Uint8Array(await file.slice(offset + 30 + nameLength, dataStart).arrayBuffer()))
      const buffer = await file.slice(dataStart, dataStart + size).arrayBuffer()
      if (buffer.byteLength !== size) throw invalid()
      return buffer
    } })
    cursor = next
  }
  if (cursor !== directory.length) throw invalid()
  ranges.sort((a, b) => a.offset - b.offset)
  for (let i = 0; i < ranges.length; i++) {
    const boundary = ranges[i + 1]?.offset ?? directoryStart
    if (ranges[i].minimumEnd > boundary) throw invalid()
    boundaries.set(ranges[i].offset, boundary)
  }
  return entries
}
