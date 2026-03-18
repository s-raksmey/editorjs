import { env } from "@/config/env";
import { R2Storage } from "./provider/r2.storage";

if (!env.server.endpoint) throw new Error("Missing R2 endpoint");

export const r2Storage = new R2Storage({
  bucket: env.server.bucket!,
  publicUrl: env.server.publicUrl!,
  s3: {
    endpoint: env.server.endpoint,
    region: env.server.region ?? "auto",
    credentials: {
      accessKeyId: env.server.accessKeyId!,
      secretAccessKey: env.server.secretAccessKey!,
    },
  },
});