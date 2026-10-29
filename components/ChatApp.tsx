"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Plus, ShieldAlert } from "lucide-react";
import Sidebar from "./Sidebar";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";
import { MAX_FILES, readAttachments } from "@/lib/files";
import {
  loadActiveId,
  loadConversations,
  newId,
  saveActiveId,
  saveConversations,
  titleFrom,
} from "@/lib/storage";
import type { AttachmentPayload, Conversation, Message, Role } from "@/lib/types";

export default function ChatApp() {
  /* ---------------- state ---------------- */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPayload[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  /* ---------------- hydrate dari localStorage ---------------- */
  useEffect(() => {
    const stored = loadConversations();
    const storedActive = loadActiveId();
    setConversations(stored);
    setActiveId(
      storedActive && stored.some((c) => c.id === storedActive)
        ? storedActive
        : (stored[0]?.id ?? null)
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  useEffect(() => {
    if (hydrated) saveActiveId(activeId);
  }, [activeId, hydrated]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );
  const messages = active?.messages ?? [];

  /* ---------------- auto-scroll ---------------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  /* ---------------- file ---------------- */
  const handleFiles = useCallback(async (list: FileList | File[]) => {
    const { accepted, errors } = await readAttachments(list);
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted].slice(0, MAX_FILES));
    }
    const overflow =
      accepted.length > 0 && accepted.length + attachments.length > MAX_FILES
        ? `Maksimal ${MAX_FILES} file per pesan.`
        : "";
    setFileError([...errors, overflow].filter(Boolean).join(" ") || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ---------------- kirim pesan ---------------- */
  const send = useCallback(async () => {
    if (busy) return;
    const text = draft.trim();
    if (!text && attachments.length === 0) return;

    const now = Date.now();
    const sentFiles = attachments;

    const userMsg: Message = {
      id: newId(),
      role: "user",
      content: text || "(file soal terlampir)",
      createdAt: now,
      attachments: sentFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    };
    const assistantMsg: Message = {
      id: newId(),
      role: "assistant",
      content: "",
      createdAt: now,
    };

    // Buat sesi baru bila belum ada yang aktif.
    let conv = active;
    if (!conv) {
      const created: Conversation = {
        id: newId(),
        title: titleFrom(
          text,
          sentFiles[0] ? `Lampiran: ${sentFiles[0].name}` : "Sesi baru"
        ),
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      conv = created;
      setConversations((prev) => [created, ...prev]);
      setActiveId(created.id);
    }
    const convId = conv.id;

    // Riwayat yang dikirim ke backend (tanpa pesan error).
    const history: { role: Role; content: string }[] = [
      ...conv.messages
        .filter((m) => !m.error && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMsg.content },
    ];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              updatedAt: now,
              messages: [...c.messages, userMsg, assistantMsg],
            }
          : c
      )
    );

    setDraft("");
    setAttachments([]);
    setFileError(null);
    stickRef.current = true;
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let acc = "";
    let lastFlush = 0;

    const flush = () => {
      const snapshot = acc;
      lastFlush = performance.now();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: snapshot } : m
                ),
              }
            : c
        )
      );
    };

    const setError = (message: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: message, error: true }
                    : m
                ),
              }
            : c
        )
      );
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, files: sentFiles }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let msg = `Server merespons HTTP ${res.status}`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) msg = data.error;
        } catch {
          /* respons bukan JSON */
        }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (performance.now() - lastFlush > 60) flush();
      }
      acc += decoder.decode();
      flush();

      if (!acc.trim()) {
        throw new Error("Model tidak mengirim konten apa pun. Cek CTF_MODEL di .env.local");
      }
    } catch (err) {
      if (controller.signal.aborted) {
        acc = acc
          ? `${acc}\n\n> ⏹ Dihentikan oleh operator.`
          : "> ⏹ Dibatalkan oleh operator sebelum stream dimulai.";
        flush();
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }, [active, attachments, busy, draft]);

  /* ---------------- aksi lain ---------------- */
  const stop = useCallback(() => abortRef.current?.abort(), []);

  const newSession = useCallback(() => {
    setActiveId(null);
    setDraft("");
    setAttachments([]);
    setFileError(null);
    setSidebarOpen(false);
  }, []);

  const selectConversation = useCallback((id: string) => setActiveId(id), []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeId) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId]
  );

  /* ---------------- render ---------------- */
  const isEmpty = !hydrated || messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newSession}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        className="relative flex min-w-0 flex-1 flex-col"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.target === e.currentTarget) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
        }}
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-neon/15 bg-ink-900/70 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost md:hidden"
            aria-label="Buka riwayat chat"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[9.5px] tracking-[0.28em] text-muted">
              <span className="text-neon">SESSION</span>
              <span className="h-px w-6 bg-neon/30" />
              <span>{busy ? "STREAMING…" : "IDLE"}</span>
            </div>
            <h1 className="truncate text-[13.5px] font-semibold text-white">
              {hydrated ? (active?.title ?? "Sesi baru — tempel soal CTF") : "Memuat…"}
            </h1>
          </div>

          <button
            type="button"
            onClick={newSession}
            className="btn-ghost hidden sm:inline-flex"
            title="Mulai sesi baru"
          >
            <Plus size={14} />
            SESI BARU
          </button>

          <span className="hidden items-center gap-1.5 rounded-sm border border-neon/25 bg-neon/5 px-2 py-1 text-[9.5px] tracking-[0.18em] text-neon sm:inline-flex">
            <ShieldAlert size={11} />
            CTF MODE
          </span>
        </header>

        {/* Area percakapan */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="grid-lines min-h-0 flex-1 overflow-y-auto"
        >
          {isEmpty ? (
            <EmptyState onPick={(text) => setDraft(text)} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
              {messages.map((msg, index) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  streaming={
                    busy &&
                    msg.role === "assistant" &&
                    index === messages.length - 1
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Overlay drag & drop */}
        {dragging && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-16 z-20 grid place-items-center bg-ink-950/80 backdrop-blur-sm">
            <div className="rounded-md border border-dashed border-neon/60 px-8 py-6 text-center shadow-neon">
              <p className="text-[12px] tracking-[0.25em] text-neon">
                LEPAS FILE UNTUK LAMPIRKAN
              </p>
              <p className="mt-1 text-[11px] text-muted">
                .txt · .py · .c · .pcap · .bin (maks {MAX_FILES} file)
              </p>
            </div>
          </div>
        )}

        <ChatInput
          value={draft}
          onValueChange={setDraft}
          attachments={attachments}
          fileError={fileError}
          onFiles={(files) => void handleFiles(files)}
          onRemoveFile={removeFile}
          onDismissError={() => setFileError(null)}
          onSend={() => void send()}
          onStop={stop}
          busy={busy}
        />
      </main>
    </div>
  );
}
