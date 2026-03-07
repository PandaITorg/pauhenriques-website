import admin from "firebase-admin";

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

function getBucket() {
  if (!admin.apps.length || !BUCKET_NAME) return null;
  return admin.storage().bucket(BUCKET_NAME);
}

export async function uploadFile(
  buffer: Buffer,
  filePath: string,
  contentType: string,
): Promise<string> {
  const bucket = getBucket();
  if (!bucket) throw new Error("Storage not available");

  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: { contentType },
    public: true,
  });

  return `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
}

export async function deleteFile(filePath: string): Promise<void> {
  const bucket = getBucket();
  if (!bucket) return;

  try {
    await bucket.file(filePath).delete();
  } catch {
    // File may not exist, ignore
  }
}

/**
 * Extract the storage file path from a full URL.
 * e.g. https://storage.googleapis.com/bucket/products/abc/img.jpg → products/abc/img.jpg
 */
export function urlToFilePath(url: string): string | null {
  if (!BUCKET_NAME) return null;
  const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}
