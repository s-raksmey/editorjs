export type UploadType = "image" | "video" | "audio" | "pdf";

export interface FileConfig {
  mime: readonly string[];
  maxSize: number;
  folder: string;
}

export const FILE_CONFIG: Record<UploadType, FileConfig> = {
  image: {
    mime: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSize: 10 * 1024 * 1024,
    folder: "uploads/images",
  },

  video: {
    mime: ["video/mp4", "video/webm", "video/quicktime"],
    maxSize: 100 * 1024 * 1024,
    folder: "uploads/videos",
  },

  audio: {
    mime: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
    maxSize: 50 * 1024 * 1024,
    folder: "uploads/audios",
  },

  pdf: {
    mime: ["application/pdf"],
    maxSize: 20 * 1024 * 1024,
    folder: "uploads/pdfs",
  },
};

export type ValidationResult =
  | { valid: true; type: UploadType }
  | { valid: false; error: string; status: number };

export interface EditorUploadResponse {
  success: 1 | 0;
  file?: {
    url: string;
    name?: string;
    size?: number;
    title?: string;
  };
  message?: string;
}