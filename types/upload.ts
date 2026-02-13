
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
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface R2UploadOpts {
  key: string;
  buffer: Uint8Array;
  mime: string;
}

export interface S3Config {
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint?: string;
  region?: string;
}

export interface R2Config {
  s3: S3Config;
  bucket: string;
  publicUrl: string;
}

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];



export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
];

export const PDF_MIME_TYPES = [
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'application/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
] as const;

export type PDFMimeType = typeof PDF_MIME_TYPES[number];

export const MAX_PDF_SIZE = 20 * 1024 * 1024;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
