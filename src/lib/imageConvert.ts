// Client-side image conversion: JPEG/PNG → WebP using Canvas.
// Keeps original dimensions; quality default 0.85 (good balance of size vs fidelity).

export interface ConvertOptions {
  quality?: number;
  maxDimension?: number;
}

export interface ConvertResult {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
  outputBytes: number;
  savedPercent: number;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function convertToWebP(
  source: File,
  { quality = 0.85, maxDimension = 2048 }: ConvertOptions = {},
): Promise<ConvertResult> {
  const originalBytes = source.size;
  const bitmap = await loadBitmap(source);

  let { width, height } = bitmap;
  if (maxDimension && Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/webp',
      quality,
    );
  });

  const baseName = source.name.replace(/\.[^.]+$/, '') || 'image';
  const file = new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });

  return {
    file,
    width,
    height,
    originalBytes,
    outputBytes: blob.size,
    savedPercent: originalBytes > 0 ? Math.round((1 - blob.size / originalBytes) * 100) : 0,
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through
    }
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
