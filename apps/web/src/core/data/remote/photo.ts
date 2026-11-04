const MAX_SIDE = 1024;
const QUALITY = 0.75;

/** Shrinks a chosen photo in the browser, so what reaches the backend stays small. */
export async function photoToDataUrl(previewUrl: string): Promise<string> {
  const blob = await (await fetch(previewUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('This browser can’t read the photo.');
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', QUALITY);
}
