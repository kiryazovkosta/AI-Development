/** Same sizes as the bundled images made by scripts/build-coin-catalog.py */
export const COIN_IMAGE_SIZE = 540;
export const COIN_THUMB_SIZE = 160;

/** Largest original the form accepts; it is shrunk before upload */
export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

export interface PreparedCoinImages {
  image: Blob;
  thumb: Blob;
  /** File extension matching the encoded type: "webp", or "jpg" where WebP can't be encoded */
  extension: 'webp' | 'jpg';
  contentType: 'image/webp' | 'image/jpeg';
}

/**
 * Turns any picture into the two square images the app shows: the original is fitted inside a
 * white square (like the bundled images), then encoded as WebP. Safari can't encode WebP from a
 * canvas, so there it falls back to JPEG.
 */
export async function prepareCoinImages(file: File): Promise<PreparedCoinImages> {
  const bitmap = await createImageBitmap(file);
  try {
    const image = await encode(bitmap, COIN_IMAGE_SIZE, 0.85, 'image/webp');
    const webp = image.type === 'image/webp';
    const contentType = webp ? 'image/webp' : 'image/jpeg';
    return {
      image: webp ? image : await encode(bitmap, COIN_IMAGE_SIZE, 0.85, contentType),
      thumb: await encode(bitmap, COIN_THUMB_SIZE, 0.8, contentType),
      extension: webp ? 'webp' : 'jpg',
      contentType,
    };
  } finally {
    bitmap.close();
  }
}

function encode(bitmap: ImageBitmap, size: number, quality: number, type: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))),
      type,
      quality
    )
  );
}
