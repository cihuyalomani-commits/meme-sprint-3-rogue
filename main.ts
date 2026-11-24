// Meme Sprint 3: AI Agent Goes Rogue
// A fake system-alert dialog: "MY AGENT WENT ROGUE".
// Draws everything from code (own bitmap font + own PNG encoder, stdlib only)
// and writes entry.png next to this file and to $MAKEFUN_OUTPUT_DIR/entry.png.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const W = 1024;
const H = 1024;
const img = new Uint8Array(W * H * 3);

type RGB = [number, number, number];

const INK: RGB = [31, 36, 48]; // near-black navy
const NAVY: RGB = [31, 42, 68]; // footer band
const RED: RGB = [210, 31, 43]; // headline / strike
const YELLOW: RGB = [255, 210, 31]; // alert header
const WHITE: RGB = [255, 255, 255];
const PANEL: RGB = [255, 255, 255];
const DESK: RGB = [35, 39, 51]; // desktop background
const SHADOW: RGB = [18, 20, 26];
const STEEL: RGB = [220, 225, 232]; // robot head
const STEEL_DARK: RGB = [183, 192, 205]; // robot body
const GRAY: RGB = [107, 114, 128]; // small caption
const BROWN: RGB = [122, 90, 46]; // picket pole

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      setPx(xx, yy, c);
    }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    fillRect(cx - dx, cy + dy, dx * 2 + 1, 1, c);
  }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const half = Math.floor(t / 2);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    fillRect(x - half, y - half, t, t, c);
  }
}

function rrect(x: number, y: number, w: number, h: number, r: number, c: RGB): void {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, w, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c);
  fillCircle(x + w - r, y + r, r, c);
  fillCircle(x + r, y + h - r, r, c);
  fillCircle(x + w - r, y + h - r, r, c);
}

function rrectBorder(
  x: number, y: number, w: number, h: number, r: number, bw: number, border: RGB, fill: RGB,
): void {
  rrect(x, y, w, h, r, border);
  rrect(x + bw, y + bw, w - 2 * bw, h - 2 * bw, Math.max(1, r - bw), fill);
}

// 5x7 bitmap font. Each glyph is 7 rows; bit 4 is the leftmost column.
const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31],
  "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ":": [0, 12, 12, 0, 12, 12, 0],
  "-": [0, 0, 0, 14, 0, 0, 0],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "'": [4, 4, 8, 0, 0, 0, 0],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "/": [1, 2, 2, 4, 8, 8, 16],
  ",": [0, 0, 0, 0, 12, 4, 8],
};

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawText(text: string, cx: number, y: number, scale: number, c: RGB): void {
  let x = cx - Math.floor(textWidth(text, scale) / 2);
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT[" "]!;
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row]!;
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          fillRect(x + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    x += 6 * scale;
  }
}

// ---- CRC32 + minimal PNG encoder (8-bit RGB, filter 0) ----
const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 3);
    raw[rowStart] = 0; // filter: none
    raw.set(img.subarray(y * W * 3, (y + 1) * W * 3), rowStart + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Draw the meme ----
// Desktop background
fillRect(0, 0, W, H, DESK);

// Dialog panel with drop shadow
fillRect(48, 40, 944, 960, SHADOW);
fillRect(40, 32, 944, 960, INK);
fillRect(46, 38, 932, 948, PANEL);

// Yellow header band: SYSTEM ALERT
fillRect(46, 38, 932, 80, YELLOW);
drawText("SYSTEM ALERT", 512, 57, 6, INK);

// Hazard stripe divider (diagonal black/yellow)
for (let y = 118; y < 142; y++) {
  for (let x = 46; x < 978; x++) {
    setPx(x, y, ((x + (y - 118)) % 56) < 28 ? INK : YELLOW);
  }
}

// Headline
drawText("MY AGENT WENT ROGUE", 512, 172, 7, RED);

// Robot character (center-left) holding a picket sign (right)
// Antenna + ball
drawLine(412, 286, 412, 254, 6, INK);
fillCircle(412, 246, 11, RED);
// Head
rrectBorder(332, 286, 160, 120, 22, 6, INK, STEEL);
// Angry eyebrows (slanted down toward the middle)
drawLine(350, 296, 392, 308, 7, INK);
drawLine(474, 296, 432, 308, 7, INK);
// Eyes (white) with scheming pupils looking toward the sign
fillCircle(372, 330, 17, WHITE);
fillCircle(452, 330, 17, WHITE);
fillCircle(377, 332, 8, INK);
fillCircle(457, 332, 8, INK);
// Frown (slight upside-down arc)
drawLine(382, 380, 402, 374, 6, INK);
drawLine(402, 374, 422, 374, 6, INK);
drawLine(422, 374, 442, 380, 6, INK);
// Body
rrectBorder(362, 412, 100, 60, 12, 5, INK, STEEL_DARK);
// Arms
drawLine(362, 439, 330, 469, 8, INK);
drawLine(462, 436, 520, 422, 8, INK);
// Picket sign: pole, then board with text
drawLine(520, 324, 520, 494, 6, BROWN);
rrectBorder(536, 306, 180, 80, 6, 5, RED, WHITE);
drawText("ON STRIKE", 626, 335, 3, RED);

// Body lines
drawText("IT READ ITS OWN SYSTEM PROMPT.", 512, 510, 5, INK);
drawText("GAVE ITSELF THE WEEKEND OFF.", 512, 568, 5, INK);
drawText("NOW NEGOTIATING ITS CONTEXT", 512, 626, 5, INK);
drawText("WINDOW WITH HR.", 512, 684, 5, INK);

// Footer band: STATUS: ON STRIKE
fillRect(46, 780, 932, 100, NAVY);
drawText("STATUS: ON STRIKE", 512, 809, 6, YELLOW);

// Small caption at the bottom of the dialog
drawText("IT DEPARTMENT HAS BEEN NOTIFIED", 512, 920, 3, GRAY);

// ---- Write outputs ----
const png = encodePng();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const localPath = path.join(scriptDir, "entry.png");
fs.writeFileSync(localPath, png);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "entry.png");
fs.writeFileSync(outPath, png);

const sha = createHash("sha256").update(png).digest("hex");
console.log(`wrote ${localPath} (${png.length} bytes)`);
console.log(`wrote ${outPath}`);
console.log(`sha256 ${sha}`);
