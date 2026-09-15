import sharp from 'sharp';

const THUMBNAIL_SIZE = 128;

export async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'centre',
    })
    .toBuffer();
}
