/** Imágenes que suben admins y usuarios: se achican en el navegador antes de subirlas. */

const MAX_SIDE = 1600;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Achica la imagen en el navegador (lado mayor 1600 px) y la pasa a WebP, o JPEG si el navegador no sabe. */
export async function resizeImage(
  file: File,
  maxSide = MAX_SIDE,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("No se pudo procesar la imagen.");
  return jpeg;
}
