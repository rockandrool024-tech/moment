// Deterministic placeholder-avatar PNG generator — a geometric identicon
// seeded from (userId + avatarGeneratedAt), so "Generate avatar" visibly
// changes the result without needing a real image-gen provider yet. Swap
// generatePng() for a real API call once an AI_AVATAR_PROVIDER_KEY exists
// (store the returned URL in User.avatarUrl instead of deriving on the fly).
import { createHash } from "crypto";
import { deflateSync } from "zlib";

const SIZE = 256;
const GRID = 6; // 6x6 mirrored grid, GitHub-identicon style

function crc32(buf: Buffer): number {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let cachedTable: Uint32Array | null = null;
function crc32Table(): Uint32Array {
  if (cachedTable) return cachedTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  cachedTable = table;
  return table;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function hashToBits(seed: string): { hue: number; cells: boolean[][] } {
  const digest = createHash("sha256").update(seed).digest();
  const hue = digest[0] % 360;
  const cells: boolean[][] = [];
  let byteIdx = 1;
  for (let row = 0; row < GRID; row++) {
    const rowBits: boolean[] = [];
    for (let col = 0; col < Math.ceil(GRID / 2); col++) {
      rowBits.push((digest[byteIdx % digest.length] >> (col % 8)) % 2 === 0);
      byteIdx++;
    }
    // Mirror the left half across to the right half.
    const full = [...rowBits, ...[...rowBits].reverse().slice(GRID % 2)];
    cells.push(full.slice(0, GRID));
  }
  return { hue, cells };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function generateAvatarPng(seed: string): Buffer {
  const { hue, cells } = hashToBits(seed);
  const [fr, fg, fb] = hslToRgb(hue, 0.55, 0.48);
  const bg: [number, number, number] = [246, 246, 244];
  const cellSize = SIZE / GRID;

  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  let offset = 0;
  for (let y = 0; y < SIZE; y++) {
    raw[offset++] = 0;
    const row = Math.min(GRID - 1, Math.floor(y / cellSize));
    for (let x = 0; x < SIZE; x++) {
      const col = Math.min(GRID - 1, Math.floor(x / cellSize));
      const on = cells[row][col];
      const [r, g, b] = on ? [fr, fg, fb] : bg;
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const idat = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
