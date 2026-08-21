import { randomUUID } from "node:crypto";
import { join, resolve, sep } from "node:path";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function getAvatarUploadPath(): string {
  return resolve(process.env.AVATAR_UPLOAD_DIR ?? join(process.cwd(), "data", "avatars"));
}

export function resolveAvatarFilePath(fileKey: string): string {
  const root = getAvatarUploadPath();
  const destination = resolve(root, fileKey);
  if (!destination.startsWith(`${root}${sep}`)) {
    throw new Error("Invalid avatar storage key");
  }
  return destination;
}

export type AvatarFormat = {
  extension: "jpg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

function startsWithBytes(buffer: Buffer, bytes: number[], offset = 0): boolean {
  return bytes.every((value, index) => buffer[offset + index] === value);
}

/** Detect the actual image signature; never trust the multipart filename or MIME header. */
export function detectAvatarFormat(buffer: Buffer): AvatarFormat | null {
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: "png", mimeType: "image/png" };
  }

  if (
    startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWithBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { extension: "webp", mimeType: "image/webp" };
  }

  return null;
}

export function createAvatarFileKey(userId: string, format: AvatarFormat): string {
  return `${userId}/${randomUUID()}.${format.extension}`;
}
