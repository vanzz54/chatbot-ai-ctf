"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

/** Ubah subtree React (termasuk span hasil syntax highlighting) jadi teks polos. */
export function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return nodeToText(props?.children);
  }
  return "";
}

interface CodeBlockProps {
  className?: string;
  children?: ReactNode;
}

export default function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const raw = nodeToText(children);
  const lang =
    (className || "").replace("language-", "").split(/\s+/)[0] || "code";
  const lineCount = raw.split("\n").length;

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = raw;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }

    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="codeblock">
      <div className="codeblock__bar">
        <div className="flex min-w-0 items-center gap-3">
          <span className="codeblock__lang">{lang.toUpperCase()}</span>
          <span className="codeblock__meta truncate">
            {lineCount} line{lineCount > 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="codeblock__copy"
          aria-label="Salin kode ke clipboard"
        >
          {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <div className="codeblock__body">
        <pre>
          <code className={`hljs ${className ?? ""}`}>{children}</code>
        </pre>
      </div>
    </div>
  );
}
