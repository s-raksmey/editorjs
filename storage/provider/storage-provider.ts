import { SignedDownloadOptions, SignedUploadOptions } from "@/types/storage"

export interface StorageProvider {
  getSignedUploadUrl(opts: SignedUploadOptions): Promise<string>

  getSignedDownloadUrl(opts: SignedDownloadOptions): Promise<string>

  delete(key: string): Promise<void>

  deleteMany(keys: string[]): Promise<void>

  exists(key: string): Promise<boolean>
}