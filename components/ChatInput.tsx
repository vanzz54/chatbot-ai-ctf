"use client";

import { useEffect, useRef } from "react";
import { Loader2, Paperclip, Send, Square, X } from "lucide-react";
import { formatSize } from "@/lib/storage";
import { MAX_FILES } from "@/lib/files";
import type { AttachmentPayload } from "@/lib/types";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  attachments: AttachmentPayload[];
  fileError: string | null;
  onFiles: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  onDismissError: () => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
}

export default function ChatInput({
  value,
  onValueChange,
  attachments,
  fileError,
  onFiles,
  onRemoveFile,
  onDismissError,
  onSend,
  onStop,
  busy,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy) onSend();
    }
  }

  const canSend = !busy && (value.trim().length > 0 || attachments.length > 0);

  return (
    <div className="border-t border-neon/15 bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        {/* Error pembacaan file */}
        {fileError && (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
            <span className="break-words">{fileError}</span>
            <button
              type="button"
              onClick={onDismissError}
              className="shrink-0 rounded-sm p-0.5 hover:bg-danger/20 focus-visible:outline-none"
              aria-label="Tutup pesan error"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Chip lampiran */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="group inline-flex max-w-[240px] items-center gap-2 rounded-sm border border-neon/30 bg-neon/10 px-2 py-1.5 text-[11.5px] text-neon-soft"
              >
                <Paperclip size={12} className="shrink-0" />
                <span className="truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="shrink-0 text-muted">{formatSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="shrink-0 rounded-sm p-0.5 text-muted transition-colors hover:bg-danger/20 hover:text-danger focus-visible:outline-none"
                  aria-label={`Hapus ${file.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-end gap-2 rounded-md border border-neon/25 bg-ink-850 px-3 py-2.5 shadow-neon transition-colors focus-within:border-neon/60">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= MAX_FILES}
            className="btn-ghost !px-2 !py-2 shrink-0"
            aria-label="Lampirkan file soal"
            title={`Lampirkan file soal (maks ${MAX_FILES} file)`}
          >
            <Paperclip size={16} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) onFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Tempel soal CTF di sini… (Enter untuk kirim · Shift+Enter baris baru)"
            className="max-h-[180px] min-h-[38px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] leading-relaxed text-body outline-none placeholder:text-muted/80"
          />

          {busy ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-danger/50 bg-danger/15 px-3 py-2 text-[11px] font-semibold tracking-widest text-danger transition-all hover:bg-danger/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger/60"
              aria-label="Hentikan generator"
            >
              <Square size={12} fill="currentColor" />
              STOP
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-neon/50 bg-neon/15 px-3 py-2 text-[11px] font-semibold tracking-widest text-neon transition-all hover:bg-neon/30 hover:shadow-neon disabled:cursor-not-allowed disabled:border-neon/20 disabled:bg-transparent disabled:text-muted disabled:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon/60"
              aria-label="Kirim pesan"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              KIRIM
            </button>
          )}
        </div>

        {/* Footer hint */}
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] tracking-[0.14em] text-muted">
          <span>
            {MAX_FILES} FILE MAKS · 10 MB/FILE · TEKS &amp; BINER (.pcap/.bin → strings)
          </span>
          <span className={busy ? "text-neon" : ""}>
            {busy ? "● STREAMING" : "○ READY"}
          </span>
        </div>
      </div>
    </div>
  );
}
