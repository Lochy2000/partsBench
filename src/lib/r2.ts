import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2_ENDPOINT is only set for MinIO/local S3-compatible stores (docker-compose.yml); real R2
// derives its endpoint from the account ID instead. forcePathStyle is required for MinIO and
// harmless for R2, so it's left on unconditionally rather than branching per-target.
const endpoint =
  process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const BUCKET = process.env.R2_BUCKET!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: 300 });
}

export function createDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export function deleteObject(key: string) {
  return r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
