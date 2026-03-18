import { randomUUID } from "crypto";
import { FILE_CONFIG, UploadType } from "@/types/upload";

export function generateUploadKey(file: File, type: UploadType) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const folder = FILE_CONFIG[type].folder;

  return `${folder}/${randomUUID()}-${safeName}`;
}