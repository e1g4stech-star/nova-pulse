import { put, del } from "@vercel/blob";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const key = `media/${timestamp}-${fileName}`;

  const blob = await put(key, file, {
    access: "public",
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return {
    url: blob.url,
    key: blob.pathname,
    size: blob.size || 0,
  };
}

export async function deleteFile(url: string): Promise<void> {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

export function detectFileType(mimeType: string): "image" | "video" | "3d" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";

  const modelTypes = [
    "model/gltf+json",
    "model/gltf-binary",
    "application/octet-stream",
  ];
  if (modelTypes.includes(mimeType)) return "3d";
  if (mimeType.includes("gltf") || mimeType.includes("glb")) return "3d";

  return "image";
}