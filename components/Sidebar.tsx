"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { relativeTime } from "@/lib/storage";
import type { Conversation, HealthStatus } from "@/lib/types";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
}: Props) {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: HealthStatus) => {
        if (alive) setHealth(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/65 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-neon/15 bg-ink-900 transition-transform duration-200 md:relative md:z-auto md:w-64 md:translate-x-0 lg:w-72 ${
          open ? "translate-x-0 shadow-neon" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-neon/15 px-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-neon/40 bg-neon/10 text-[13px] font-bold text-neon shadow-neon">
            &gt;_
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold tracking-[0.25em] text-white text-glow">
              AUTOCTF
            </div>
            <div className="text-[9px] tracking-[0.28em] text-muted">
              SOLVER // v1.0
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !px-1.5 md:hidden"
            aria-label="Tutup sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tombol sesi baru */}
        <div className="p-3">
          <button
            type="button"
            onClick={onNew}
            className="flex w-full items-center justify-between rounded-sm border border-neon/30 bg-neon/5 px-3 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-neon transition-all hover:bg-neon/15 hover:shadow-neon focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon/60"
          >
            <span>NEW SESSION</span>
            <Plus size={14} />
          </button>
        </div>

        {/* Label riwayat */}
        <div className="px-4 pb-2 text-[9.5px] tracking-[0.25em] text-muted">
          RIWAYAT // {conversations.length} SESI
        </div>

        {/* Daftar percakapan */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-[11.5px] leading-relaxed text-muted">
              Belum ada riwayat.
              <br />
              Mulai dengan menempel soal CTF pertamamu.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => {
                const active = conv.id === activeId;
                return (
                  <li key={conv.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelect(conv.id);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSelect(conv.id);
                          onClose();
                        }
                      }}
                      className={`group flex w-full cursor-pointer items-center gap-2 border-l-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon/60 ${
                        active
                          ? "border-neon bg-neon/10"
                          : "border-transparent hover:border-neon/40 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[12.5px] ${
                            active ? "text-white" : "text-body/80"
                          }`}
                          title={conv.title}
                        >
                          {conv.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-[9.5px] tracking-wider text-muted">
                          <span>{relativeTime(conv.updatedAt)}</span>
                          <span>· {conv.messages.length} pesan</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="shrink-0 rounded-sm p-1 text-muted opacity-0 transition-all hover:bg-danger/20 hover:text-danger focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger/60 group-hover:opacity-100"
                        aria-label={`Hapus sesi ${conv.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Status koneksi AI */}
        <div className="border-t border-neon/15 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.16em]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health === null
                  ? "bg-muted"
                  : health.configured
                    ? "bg-neon shadow-neon animate-blink"
                    : "bg-warn"
              }`}
            />
            <span className={health?.configured ? "text-neon" : "text-warn"}>
              {health === null
                ? "MEMERIKSA…"
                : health.configured
                  ? "API CONNECTED"
                  : "DEMO MODE"}
            </span>
          </div>
          <p className="mt-1 truncate text-[9.5px] tracking-wider text-muted" title={health?.provider}>
            {health ? `${health.provider} · ${health.model}` : "…"}
          </p>
        </div>
      </aside>
    </>
  );
}
