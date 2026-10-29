export type Role = "user" | "assistant";

/** Metadata ringan yang ikut tersimpan di riwayat chat. */
export interface AttachmentMeta {
  name: string;
  size: number;
  type: string;
}

/** Payload lengkap yang hanya dikirim sekali ke backend saat user menekan Kirim. */
export interface AttachmentPayload extends AttachmentMeta {
  /** "text"   : isi file teks langsung
   *  "strings" : printable strings hasil ekstraksi (file biner) */
  encoding: "text" | "strings";
  sha256: string;
  content: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  attachments?: AttachmentMeta[];
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ChatRequestBody {
  messages: { role: Role; content: string }[];
  files?: AttachmentPayload[];
}

export interface HealthStatus {
  configured: boolean;
  model: string;
  provider: string;
}
