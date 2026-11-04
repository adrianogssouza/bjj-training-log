import fs from "fs";
import path from "path";
import zlib from "zlib";

function writePNG(width, height, pixelBuffer) {
  // pixelBuffer is RGBA Buffer of length width * height * 4
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = 1 + width * 4;
  const rawScanlines = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawScanlines[rowOffset] = 0; // Filter None
    const srcRowOffset = y * width * 4;
    pixelBuffer.copy(rawScanlines, rowOffset + 1, srcRowOffset, srcRowOffset + width * 4);
  }

  const idatCompressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk("IDAT", idatCompressed);

  // IEND
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = zlib.crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ddx = px - x1;
    const ddy = py - y1;
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);
  return Math.sqrt(distSq);
}

function generateBikeIconBuffer(size) {
  const buffer = Buffer.alloc(size * size * 4);

  // Colors
  const bgR = 0x09, bgG = 0x09, bgB = 0x0b; // #09090B
  const redR = 0xdc, redG = 0x26, redB = 0x26; // #DC2626
  const whiteR = 0xf4, whiteG = 0xf4, whiteB = 0xf5; // #F4F4F5

  // Geometry: 13% horizontal margins
  // Left margin = 0.13 * size, Right margin = 0.13 * size
  // Active width = 0.74 * size
  const wheelRadius = 0.13 * size;
  const wheelStroke = 0.030 * size;
  const frameStroke = 0.024 * size;

  const rearX = 0.13 * size + wheelRadius; // = 0.26 * size
  const frontX = size - 0.13 * size - wheelRadius; // = 0.74 * size
  const wheelY = 0.63 * size;

  // Frame landmarks
  const bbX = 0.46 * size;
  const bbY = 0.62 * size;

  const seatJointX = 0.39 * size;
  const seatJointY = 0.41 * size;
  const saddleX1 = 0.34 * size;
  const saddleX2 = 0.45 * size;
  const saddleY = 0.34 * size;

  const headJointX = 0.64 * size;
  const headJointY = 0.39 * size;
  const stemTopX = 0.66 * size;
  const stemTopY = 0.31 * size;
  const handleX1 = 0.62 * size;
  const handleX2 = 0.71 * size;
  const handleY = 0.31 * size;

  const frameSegments = [
    // Rear triangle
    [rearX, wheelY, bbX, bbY], // chainstay
    [rearX, wheelY, seatJointX, seatJointY], // seatstay
    [seatJointX, seatJointY, bbX, bbY], // seat tube

    // Front triangle
    [seatJointX, seatJointY, headJointX, headJointY], // top tube
    [bbX, bbY, headJointX, headJointY], // down tube

    // Fork
    [headJointX, headJointY, frontX, wheelY], // fork

    // Seat post & saddle
    [seatJointX, seatJointY, (saddleX1 + saddleX2) / 2, saddleY], // seatpost
    [saddleX1, saddleY, saddleX2, saddleY], // saddle

    // Stem & handlebar
    [headJointX, headJointY, stemTopX, stemTopY], // stem
    [handleX1, handleY, handleX2, handleY], // handlebar
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Start with background
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Red wheels: circular ring
      const distRear = Math.sqrt((x - rearX) * (x - rearX) + (y - wheelY) * (y - wheelY));
      const distFront = Math.sqrt((x - frontX) * (x - frontX) + (y - wheelY) * (y - wheelY));

      const ringDistRear = Math.abs(distRear - (wheelRadius - wheelStroke / 2));
      const ringDistFront = Math.abs(distFront - (wheelRadius - wheelStroke / 2));
      const minRingDist = Math.min(ringDistRear, ringDistFront);

      let redAlpha = 0;
      if (minRingDist < wheelStroke / 2 + 1) {
        redAlpha = Math.max(0, Math.min(1, (wheelStroke / 2 + 0.8 - minRingDist) / 1.2));
      }

      // Small axle hub center
      if (distRear < wheelStroke * 0.7 || distFront < wheelStroke * 0.7) {
        const hubDist = Math.min(distRear, distFront);
        const hubAlpha = Math.max(0, Math.min(1, (wheelStroke * 0.7 - hubDist) / 1.0));
        redAlpha = Math.max(redAlpha, hubAlpha);
      }

      // White frame
      let minFrameDist = Infinity;
      for (const [x1, y1, x2, y2] of frameSegments) {
        const d = distToSegment(x, y, x1, y1, x2, y2);
        if (d < minFrameDist) minFrameDist = d;
      }

      let whiteAlpha = 0;
      if (minFrameDist < frameStroke / 2 + 1) {
        whiteAlpha = Math.max(0, Math.min(1, (frameStroke / 2 + 0.8 - minFrameDist) / 1.2));
      }

      // Blend: red wheels first, then white frame over
      if (redAlpha > 0) {
        r = Math.round(r * (1 - redAlpha) + redR * redAlpha);
        g = Math.round(g * (1 - redAlpha) + redG * redAlpha);
        b = Math.round(b * (1 - redAlpha) + redB * redAlpha);
      }
      if (whiteAlpha > 0) {
        r = Math.round(r * (1 - whiteAlpha) + whiteR * whiteAlpha);
        g = Math.round(g * (1 - whiteAlpha) + whiteG * whiteAlpha);
        b = Math.round(b * (1 - whiteAlpha) + whiteB * whiteAlpha);
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  return writePNG(size, size, buffer);
}

const iconsDir = path.resolve("public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 180x180, 192x192, 512x512
const sizes = [180, 192, 512];
for (const size of sizes) {
  const pngBuf = generateBikeIconBuffer(size);
  const outPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated ${outPath} (${pngBuf.length} bytes)`);

  if (size === 180) {
    fs.writeFileSync(path.resolve("public/apple-touch-icon.png"), pngBuf);
    console.log(`Generated public/apple-touch-icon.png`);
  }
}
