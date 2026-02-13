
import { S3Client } from 'bun';
import type { R2UploadOpts, R2Config } from '@/types/upload';
import type { S3FilePresignOptions } from 'bun';
import { Buffer } from 'buffer';

export class R2Storage {
  private client: S3Client;
  private bucket: string;
  public readonly publicUrl: string;

  constructor(opts: R2Config) {
    this.client = new S3Client({
      accessKeyId: opts.s3.credentials?.accessKeyId || '',
      secretAccessKey: opts.s3.credentials?.secretAccessKey || '',
      endpoint: opts.s3.endpoint || '',
      region: opts.s3.region || 'auto',
    });
    this.bucket = opts.bucket;
    this.publicUrl = opts.publicUrl;
  }

  // Write/upload a file
  async write(key: string, data: string | Buffer | Uint8Array | Response, options?: BlobPropertyBag): Promise<number> {
    return this.client.write(`${this.bucket}/${key}`, data, options);
  }

  // Upload helper for Editor
  async upload(opts: R2UploadOpts): Promise<string> {
    await this.write(opts.key, opts.buffer);
    return `${this.publicUrl}/${opts.key}`;
  }

  // Delete a file
  async delete(key: string): Promise<void> {
    await this.client.delete(`${this.bucket}/${key}`);
  }

  // Check if a file exists
  async exists(key: string): Promise<boolean> {
    return this.client.exists(`${this.bucket}/${key}`);
  }

  // Get a file reference (S3File)
  file(key: string) {
    return this.client.file(`${this.bucket}/${key}`);
  }

  // List files in the bucket (optionally with prefix)
  async list(prefix = "", maxKeys = 1000) {
    return this.client.list({ prefix: `${this.bucket}/${prefix}`, maxKeys });
  }

  // Generate a presigned URL
  presign(key: string, options?: S3FilePresignOptions) {
    if (options && options.method && !["GET", "POST", "PUT", "DELETE", "HEAD"].includes(options.method)) {
      throw new Error(`Invalid HTTP method for presign: ${options.method}`);
    }
    return this.client.presign(`${this.bucket}/${key}`, options);
  }

  // Get file size (deprecated, use stat)
  async size(key: string): Promise<number> {
    return this.client.size(`${this.bucket}/${key}`);
  }

  // Get file metadata
  async stat(key: string): Promise<{ etag: string; lastModified: Date; size: number; type: string }> {
    return this.client.stat(`${this.bucket}/${key}`);
  }

  // Unlink (alias for delete)
  async unlink(key: string): Promise<void> {
    await this.delete(key);
  }
}