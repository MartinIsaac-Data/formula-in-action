/**
 * Generates solid-colour placeholder PNGs for the ribbon icons, with no
 * dependencies. Replace `icon-*.png` with real artwork before AppSource.
 *
 *   node assets/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('.', import.meta.url));
const SIZES = [16, 32, 64, 80, 128];
const RGBA = [91, 95, 199, 255]; // Fluent brand-ish purple

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  const out = Buffer.alloc(8 + body.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + body.length);
  return out;
}

function png(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA

  const row = Buffer.alloc(1 + size * 4);
  for (let x = 0; x < size; x += 1) row.set(RGBA, 1 + x * 4);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of SIZES) {
  writeFileSync(`${DIR}/icon-${size}.png`, png(size));
  console.log(`wrote icon-${size}.png`);
}
