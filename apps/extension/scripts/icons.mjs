// Draws the Gather logo as PNGs with no image dependencies.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// The Gather logo (same shapes as apps/web/public/icon.svg), in its 32x32 design grid.
const DARK = [[9, 22], [12, 13], [19, 20], [10, 23]];
const WHITE = [[13, 12], [19, 6], [26, 13], [20, 19]];
function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inRoundRect(px, py) {
  const r = 8, cx = Math.min(Math.max(px, r), 32 - r), cy = Math.min(Math.max(py, r), 32 - r);
  return px >= 0 && px <= 32 && py >= 0 && py <= 32 && Math.hypot(px - cx, py - cy) <= r;
}
function sample(px, py) {
  if (!inRoundRect(px, py)) return null;
  if (inPoly(px, py, WHITE)) return [0xff, 0xff, 0xff];
  if (inPoly(px, py, DARK)) return [0x20, 0x21, 0x24];
  return [0xfb, 0xbc, 0x04];
}

/** Renders the logo at `size` px, leaving `pad` px of transparent margin on each side. 4x4 supersampled. */
function png(size, pad = 0) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const art = size - 2 * pad, N = 4;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) {
        const c = sample(((x - pad + (sx + 0.5) / N) / art) * 32, ((y - pad + (sy + 0.5) / N) / art) * 32);
        if (c) { R += c[0]; G += c[1]; B += c[2]; A++; }
      }
      const i = y * (size * 4 + 1) + 1 + x * 4;
      if (A) { raw[i] = R / A; raw[i + 1] = G / A; raw[i + 2] = B / A; raw[i + 3] = Math.round((A / (N * N)) * 255); }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function writeIcons(dir) {
  mkdirSync(dir, { recursive: true });
  for (const s of [16, 32, 48, 128]) writeFileSync(join(dir, `${s}.png`), png(s));
}

/** Chrome Web Store listing icon: 128x128 with 96x96 artwork and 16px transparent padding. */
export function writeStoreIcon(file) {
  writeFileSync(file, png(128, 16));
}
