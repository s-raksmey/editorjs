import { SignedDownloadOptions, SignedUploadOptions } from "@/types/storage";
import { S3Client } from "bun";
import { StorageProvider } from "./storage-provider";

export class R2Storage implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  public readonly publicUrl: string;

  constructor(opts: {
    bucket: string;
    publicUrl: string;
    s3: {
      endpoint: string;
      region?: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    };
  }) {
    this.client = new S3Client({
      accessKeyId: opts.s3.credentials.accessKeyId,
      secretAccessKey: opts.s3.credentials.secretAccessKey,
      endpoint: opts.s3.endpoint,
      region: opts.s3.region ?? "auto",
    });

    this.bucket = opts.bucket;
    this.publicUrl = opts.publicUrl;
  }

  async getSignedUploadUrl(opts: SignedUploadOptions): Promise<string> {
    return this.client.presign(`${this.bucket}/${opts.key}`, {
      method: "PUT",
      type: opts.mime,
      expiresIn: opts.expiresIn ?? 300,
    });
  }

  async getSignedDownloadUrl(opts: SignedDownloadOptions): Promise<string> {
    return this.client.presign(`${this.bucket}/${opts.key}`, {
      method: "GET",
      expiresIn: opts.expiresIn ?? 300,
    });
  }

  async delete(key: string): Promise<void> {
    const file = this.client.file(`${this.bucket}/${key}`);
    await file.delete();
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async exists(key: string): Promise<boolean> {
    try {
      const file = this.client.file(`${this.bucket}/${key}`);
      await file.stat();
      return true;
    } catch {
      return false;
    }
  }
}
