"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { AlertTriangle, Bot, Check, ClipboardCheck, Copy, Paperclip, User } from "lucide-react";
import CodeBlock, { nodeToText } from "./CodeBlock";
import { formatSize } from "@/lib/storage";
import type { Message } from "@/lib/types";

const components: Components = {
  pre: ({ children }) => {
    const child = Array.isArray(children) ? children[0] : children;
    if (child && typeof child === "object" && "props" in child) {
      const props = (child as { props?: { className?: string; children?: ReactNode } })
        .props;
      return (
        <CodeBlock className={props?.className}>{props?.children}</CodeBlock>
      );
    }
    return <pre>{children}</pre>;
  },
  code: ({ children }) => <code className="inline-code">{nodeToText(children)}</code>,
};

interface Props {
  message: Message;
  streaming?: boolean;
}

function MessageBubble({ message, streaming = false }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const isUser = message.role === "user";

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  const time = new Date(message.createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`animate-slideUp flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-sm border text-[11px] font-bold ${
          isUser
            ? "border-ice/40 bg-ice/10 text-ice"
            : "border-neon/40 bg-neon/10 text-neon shadow-neon"
        }`}
        aria-hidden
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={`min-w-0 ${isUser ? "max-w-[88%]" : "flex-1 max-w-full"}`}>
        <div
          className={`mb-1.5 flex items-center gap-2 text-[10px] tracking-[0.18em] ${
            isUser ? "justify-end" : ""
          }`}
        >
          <span className={isUser ? "text-ice/80" : "text-neon/80"}>
            {isUser ? "OPERATOR" : "AUTOCTF"}
          </span>
          <span className="text-muted">{time}</span>

          {!isUser && !streaming && message.content.length > 0 && (
            <button
              type="button"
              onClick={copyAll}
              className="ml-auto inline-flex items-center gap-1 rounded-sm border border-transparent px-1.5 py-0.5 text-muted transition-colors hover:border-neon/30 hover:text-neon focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon/60"
              aria-label="Salin seluruh jawaban"
            >
              {copied ? <ClipboardCheck size={11} /> : <Copy size={11} />}
              {copied ? "TERSALIN" : "SALIN"}
            </button>
          )}
        </div>

        <div
          className={
            isUser
              ? "rounded-md border border-ice/25 bg-ice/10 px-4 py-3 text-[13.5px] leading-relaxed text-body shadow-panel"
              : `rounded-md border px-4 py-3.5 shadow-panel ${
                  message.error
                    ? "border-danger/40 bg-danger/10"
                    : "border-neon/15 bg-ink-850/80"
                }`
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.content.length === 0 && streaming ? (
            <div className="flex items-center gap-2 text-[12.5px] text-neon/80">
              <span>memindai tantangan</span>
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-neon animate-dot1" />
                <span className="h-1.5 w-1.5 rounded-full bg-neon animate-dot2" />
                <span className="h-1.5 w-1.5 rounded-full bg-neon animate-dot3" />
              </span>
            </div>
          ) : (
            <div className="md-cyber">
              {message.error && (
                <div className="mb-2 flex items-start gap-2 text-[12.5px] text-danger">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span className="font-semibold">GALAT</span>
                </div>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
                components={components}
              >
                {message.content}
              </ReactMarkdown>
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-neon animate-blink" />
              )}
            </div>
          )}

          {/* Chip lampiran file */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-neon/10 pt-3">
              {message.attachments.map((file) => (
                <span
                  key={`${file.name}-${file.size}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-neon/25 bg-neon/5 px-2 py-1 text-[11px] text-neon-soft"
                >
                  <Paperclip size={11} className="shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted">{formatSize(file.size)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
