import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  return imageCompression(file, options);
}
