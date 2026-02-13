import { env } from '@/config/env';
import { R2Storage } from '@/storage/r2.storage';

export const r2Storage = new R2Storage({
  bucket: env.server.bucket!,
  publicUrl: env.server.publicUrl!,
  s3: {
    region: env.server.region || 'auto',
    endpoint: env.server.endpoint,
    credentials: {
      accessKeyId: env.server.accessKeyId!,
      secretAccessKey: env.server.secretAccessKey!,
    },
  },
});
