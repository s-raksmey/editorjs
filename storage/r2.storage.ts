import { S3Client } from 'bun'
import type { R2UploadOpts, R2Config } from '@/types/upload';

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

  async upload(opts: R2UploadOpts): Promise<string> {
    const buffer = Buffer.from(opts.buffer);
    await this.client.write(`${this.bucket}/${opts.key}`, buffer);

    return `${this.publicUrl}/${opts.key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(`${this.bucket}/${key}`);
  }
}