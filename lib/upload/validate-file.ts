import { FILE_CONFIG, UploadType, ValidationResult } from "@/types/upload";

export function validateFile(file: File): ValidationResult {
  for (const [type, config] of Object.entries(FILE_CONFIG) as [
    UploadType,
    (typeof FILE_CONFIG)[UploadType]
  ][]) {
    if (config.mime.includes(file.type)) {
      if (file.size > config.maxSize) {
        return {
          valid: false,
          error: `${type} too large`,
          status: 400,
        };
      }

      return { valid: true, type };
    }
  }

  return {
    valid: false,
    error: "Unsupported file type",
    status: 400,
  };
}