/**
 * Generates the ribbon/store icons: a Fluent-purple rounded square with a
 * white "=" mark (Formula in Action explains what's after the "="). No
 * dependencies — supersampled by hand for anti-aliased edges at small sizes.
 *
 * Still a placeholder: replace with real artwork before AppSource submission
 * (see public/assets/README.md).
 *
 *   node public/assets/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('.', import.meta.url));
const SIZES = [16, 32, 64, 80, 128];
const BG = [91, 95, 199, 255]; // Fluent brand-ish purple
const FG = [255, 255, 255, 255]; // white "=" mark
const SUPERSAMPLE = 4; // 4x4 subpixel grid per pixel for anti-aliasing

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
  const body = Buffer.concat([typeBytes, data]); // type + data, for the CRC
  const out = Buffer.alloc(8 + body.length); // length(4) + type(4) + data + crc(4)
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 4 + body.length);
  return out;
}

/** Signed distance-ish inside/outside test for a rounded square, in pixel space. */
function insideRoundedSquare(x, y, size, radius) {
  const cx = x < radius ? radius : x > size - radius ? size - radius : x;
  const cy = y < radius ? radius : y > size - radius ? size - radius : y;
  if ((x < radius || x > size - radius) && (y < radius || y > size - radius)) {
    return Math.hypot(x - cx, y - cy) <= radius;
  }
  return x >= 0 && x < size && y >= 0 && y < size;
}

function insideBars(x, y, size) {
  const barWidth = size * 0.56;
  const barHeight = Math.max(size * 0.1, 1);
  const gap = size * 0.16;
  const left = (size - barWidth) / 2;
  const right = left + barWidth;
  const topBarBottom = size / 2 - gap / 2;
  const topBarTop = topBarBottom - barHeight;
  const bottomBarTop = size / 2 + gap / 2;
  const bottomBarBottom = bottomBarTop + barHeight;
  if (x < left || x > right) return false;
  return (y >= topBarTop && y <= topBarBottom) || (y >= bottomBarTop && y <= bottomBarBottom);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Coverage-weighted blend of BG/FG/transparent for one output pixel via supersampling. */
function samplePixel(px, py, size, radius) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  const step = 1 / SUPERSAMPLE;
  const half = step / 2;
  for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
    const y = py + half + sy * step;
    for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
      const x = px + half + sx * step;
      if (!insideRoundedSquare(x, y, size, radius)) continue; // transparent
      const [cr, cg, cb] = insideBars(x, y, size) ? FG : BG;
      r += cr;
      g += cg;
      b += cb;
      a += 255;
    }
  }
  const n = SUPERSAMPLE * SUPERSAMPLE;
  const coverage = a / (n * 255);
  if (coverage === 0) return [0, 0, 0, 0];
  // Un-premultiply the averaged colour so partially-covered edge pixels don't darken.
  return [Math.round(r / (n * coverage)), Math.round(g / (n * coverage)), Math.round(b / (n * coverage)), Math.round(lerp(0, 255, coverage))];
}

function png(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const radius = size * 0.22;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA

  const stride = 1 + size * 4;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = samplePixel(x, y, size, radius);
      const offset = rowStart + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

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
