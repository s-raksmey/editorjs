export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface S3Config {
  endpoint: string;
  region?: string;
  credentials: S3Credentials;
}

export interface R2Config {
  bucket: string;
  publicUrl: string;
  s3: S3Config;
}

export interface SignedUploadOptions {
  key: string
  mime: string
  expiresIn?: number
}

export interface SignedDownloadOptions {
  key: string;
  expiresIn?: number;
}