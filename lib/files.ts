import type { AttachmentPayload } from "./types";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 30 * 1024 * 1024;

const TEXT_CHAR_LIMIT = 40_000;
const STRING_CHAR_LIMIT = 25_000;

function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n… [konten dipotong: ${text.length - limit} karakter lagi]`;
}

async function sha256Hex(buf: Uint8Array): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", buf as BufferSource);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "unavailable";
  }
}

/** Decode UTF-8 strict; null kalau file sebenarnya biner. */
function tryDecodeText(buf: Uint8Array): string | null {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buf as BufferSource);
    if (text.includes("\u0000")) return null;
    return text;
  } catch {
    return null;
  }
}

/**
 * Ekstrak printable strings (>= 6 karakter) — meniru perintah `strings`
 * sehingga file biner seperti .pcap/.bin/.exe tetap bisa dianalisis AI.
 */
function extractStrings(buf: Uint8Array, max: number): string {
  const parts: string[] = [];
  let current = "";
  let total = 0;

  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    const printable =
      (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13;

    if (printable) {
      current += String.fromCharCode(byte);
      continue;
    }

    if (current.length >= 6) {
      parts.push(current);
      total += current.length + 1;
    }
    current = "";
    if (total > max) break;
  }

  if (current.length >= 6) parts.push(current);

  let out = parts.join("\n");
  if (out.length > max) out = `${out.slice(0, max)}\n… [strings dipotong]`;
  return out;
}

/**
 * Baca file dari input menjadi AttachmentPayload.
 * - file teks  -> isi penuh (dipotong 40k karakter)
 * - file biner -> printable strings + sha256
 */
export async function readAttachment(file: File): Promise<AttachmentPayload> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} terlalu besar (maks 10 MB).`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const base = {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    sha256,
  };

  const text = tryDecodeText(bytes);
  if (text !== null) {
    return { ...base, encoding: "text", content: clamp(text, TEXT_CHAR_LIMIT) };
  }

  const strings = extractStrings(bytes, STRING_CHAR_LIMIT);
  return {
    ...base,
    encoding: "strings",
    content: strings || "(tidak ada printable string yang bisa diekstrak dari file ini)",
  };
}

export async function readAttachments(files: FileList | File[]) {
  const list = Array.from(files);
  const accepted: AttachmentPayload[] = [];
  const errors: string[] = [];

  for (const file of list) {
    if (accepted.length >= MAX_FILES) {
      errors.push(`Maksimal ${MAX_FILES} file per pesan.`);
      break;
    }
    try {
      accepted.push(await readAttachment(file));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { accepted, errors };
}
