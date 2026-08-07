// One-off placeholder PWA icon generator — solid brand-color squares with an
// inset "M" mark, written directly as PNG bytes (no canvas/sharp dependency).
// Real branded icon assets should replace these before launch (see TODO.md).
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ACCENT = [0x16, 0x64, 0x3f]; // var(--accent) #16643f
const MARK = [0xe8, 0xb9, 0x3f]; // share-card gold, for contrast

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Very simple pixel-art "M" mask so the icon reads as a mark, not just a
// flat square, at both target sizes.
function isMarkPixel(x, y, size) {
  const margin = size * 0.28;
  const inner = size - margin * 2;
  const px = x - margin;
  const py = y - margin;
  if (px < 0 || py < 0 || px >= inner || py >= inner) return false;
  const strokeW = inner * 0.16;
  const leftLeg = px < strokeW;
  const rightLeg = px > inner - strokeW;
  const topBand = py < strokeW;
  // Diagonal strokes forming the "M" middle V, roughly.
  const t = px / inner;
  const vDepth = inner * 0.55;
  const diagLeftY = t * 2 * vDepth;
  const diagRightY = (1 - t) * 2 * vDepth;
  const onDiagLeft = t <= 0.5 && Math.abs(py - diagLeftY) < strokeW * 0.9;
  const onDiagRight = t >= 0.5 && Math.abs(py - diagRightY) < strokeW * 0.9;
  return leftLeg || rightLeg || topBand || onDiagLeft || onDiagRight;
}

function generatePng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const mark = isMarkPixel(x, y, size);
      const [r, g, b] = mark ? MARK : ACCENT;
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), generatePng(size));
}
console.log("Generated placeholder PWA icons in", outDir);
