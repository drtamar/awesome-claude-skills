import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, 'extension', 'icons');
mkdirSync(iconsDir, { recursive: true });

function generateSVG(size) {
  const pad = Math.round(size * 0.1);
  const r = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.55);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6c5ce7"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${r}" fill="url(#bg)"/>
  <text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold" font-size="${fontSize}">C</text>
</svg>`;
}

// Generate SVGs (PNG would need canvas, so we use SVGs as placeholder icons)
// For a real extension, convert these to PNG using a tool like sharp or Inkscape
[16, 48, 128].forEach(size => {
  const svg = generateSVG(size);
  writeFileSync(resolve(iconsDir, `icon${size}.svg`), svg);

  // Create a minimal valid PNG (1x1 pixel, will be replaced by proper icons)
  // This is a placeholder - run `convert` or use a proper tool for production
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    ...intToBytes(size), ...intToBytes(size),           // width, height
    0x08, 0x06, 0x00, 0x00, 0x00,                      // bit depth, color type, etc
  ]);

  // Write a simple placeholder (the SVGs are the real icons for development)
  writeFileSync(resolve(iconsDir, `icon${size}.png`), createMinimalPNG(size));
});

function intToBytes(n) {
  return [(n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

function createMinimalPNG(size) {
  // Create a minimal valid PNG with a purple square
  const { createCanvas } = (() => {
    try { return require('canvas'); } catch { return {}; }
  })();

  // Fallback: create a 1x1 purple pixel PNG manually
  // IHDR
  const width = 1, height = 1;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  // Raw pixel data: filter byte (0) + RGB (108, 92, 231) = purple
  const raw = Buffer.from([0, 108, 92, 231]);

  // Deflate the raw data (store block, no compression)
  const deflated = Buffer.concat([
    Buffer.from([0x78, 0x01]),                           // zlib header
    Buffer.from([0x01]),                                  // final block, stored
    Buffer.from([raw.length & 0xFF, (raw.length >> 8) & 0xFF]),
    Buffer.from([~raw.length & 0xFF, (~raw.length >> 8) & 0xFF]),
    raw
  ]);

  // Adler-32 checksum
  let a = 1, b = 0;
  for (let i = 0; i < raw.length; i++) {
    a = (a + raw[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE((b << 16) | a);

  const idat = Buffer.concat([deflated, adler]);

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

console.log('Icons generated in extension/icons/');
