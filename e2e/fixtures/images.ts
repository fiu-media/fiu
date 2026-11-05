import { crc32, deflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

/**
 * A solid-colour PNG, made here so the suite needs no image files. `tag` goes into the file as a text chunk, which
 * makes the bytes (and so Sanity's content hash) different on every run: an upload is never matched to an asset
 * the dataset already had, so cleanup can delete it without touching anyone else's.
 */
export function solidPng(
  width: number,
  height: number,
  [r, g, b]: readonly [number, number, number] | readonly number[],
  tag: string,
) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  // compression, filter and interlace stay 0

  // Each row is a filter byte (0: none) followed by its pixels.
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r!;
    row[2 + x * 3] = g!;
    row[3 + x * 3] = b!;
  }
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("tEXt", Buffer.from(`Comment\0${tag}`, "latin1")),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
