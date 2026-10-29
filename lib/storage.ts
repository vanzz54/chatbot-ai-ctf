import type { Conversation } from "./types";

const STORAGE_KEY = "autoctf:conversations:v1";
const ACTIVE_KEY = "autoctf:active:v1";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Conversation =>
        c && typeof c.id === "string" && Array.isArray(c.messages)
    );
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Kuota penuh (localStorage ~5MB): buang sesi terlama lalu coba lagi.
    try {
      const trimmed = conversations.slice(0, Math.max(1, conversations.length - 3));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      /* abaikan */
    }
  }
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* abaikan */
  }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const UNITS: Intl.RelativeTimeFormatUnit[] = ["day", "hour", "minute"];

export function relativeTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  const abs = Math.abs(diff);
  const fmt = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

  if (abs < 60_000) return "baru saja";
  if (abs < 3_600_000) return fmt.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return fmt.format(Math.round(diff / 3_600_000), "hour");
  return fmt.format(Math.round(diff / 86_400_000), UNITS[0]);
}

export function titleFrom(text: string, fallback = "Sesi tanpa judul"): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 46 ? `${clean.slice(0, 46)}…` : clean;
}
