import { NextRequest } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { AttachmentPayload, Role } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

interface IncomingMessage {
  role: Role;
  content: string;
}

interface ChatBody {
  messages?: IncomingMessage[];
  files?: AttachmentPayload[];
}

const MAX_FILE_IN_MSG = 6;
const MAX_MESSAGE_CHARS = 40_000;
const MAX_HISTORY_CHARS = 120_000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

function streamHeaders() {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function describeError(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Susun blok lampiran file agar bisa dibaca model AI. */
function renderAttachments(files: AttachmentPayload[]) {
  const blocks = files.map((file) => {
    const mode =
      file.encoding === "text"
        ? "konten file penuh"
        : "printable strings hasil ekstraksi (file biner)";
    return [
      `--- FILE: ${file.name} | ${file.size} bytes | ${file.type} | sha256=${file.sha256} | ${mode} ---`,
      "```",
      file.content,
      "```",
    ].join("\n");
  });

  return [
    "<attachments>",
    blocks.join("\n\n"),
    "</attachments>",
    "Catatan: konten di atas berasal dari file yang diunggah pengguna untuk tantangan CTF ini. Analisis isinya lebih dulu sebelum menjawab.",
  ].join("\n");
}

/** Buang pesan-pesan lama agar konteks tidak meledak. */
function trimHistory(history: IncomingMessage[]) {
  const last = history[history.length - 1];
  let total = history.reduce((sum, m) => sum + m.content.length, 0);
  const kept: IncomingMessage[] = [last];

  for (let i = history.length - 2; i >= 0; i--) {
    const msg = history[i];
    if (total + msg.content.length > MAX_HISTORY_CHARS) break;
    total += msg.content.length;
    kept.unshift(msg);
  }
  return kept;
}

/* ------------------------------------------------------------------ */
/*  Demo mode (tanpa API key) — UI tetap bisa diuji                    */
/* ------------------------------------------------------------------ */

const DEMO_RESPONSE = `## 🎯 Analisis

> ⚠️ **DEMO MODE** — \`OPENAI_API_KEY\` belum di-set, jadi ini balasan contoh untuk menguji tampilan.
>
> 1. Salin \`.env.local.example\` menjadi \`.env.local\`, lalu isi \`OPENAI_API_KEY\`.
> 2. Restart server (\`npm run dev\`), dan jawaban asli dari model AI akan muncul di sini.

| Item | Status |
| --- | --- |
| Backend streaming | ✅ aktif |
| Code block + tombol copy | ✅ aktif |
| Upload lampiran file | ✅ aktif |

## 🧭 Langkah

1. Isi \`OPENAI_API_KEY\` (dan opsional \`CTF_MODEL\`) di \`.env.local\`.
2. Jalankan ulang \`npm run dev\`.
3. Uji dengan salah satu contoh tantangan di bawah kolom input.

## 🛠️ Solver

\`\`\`bash
# target: https://example-ctf.local
# contoh pipeline kecil untuk memverifikasi koneksi provider
curl -s https://api.openai.com/v1/models \\
  -H "Authorization: Bearer $OPENAI_API_KEY" | head -c 300
\`\`\`

## 🚩 Flag

\`flag{configure_your_api_key_first}\``;

function demoStream() {
  const chunks = DEMO_RESPONSE.match(/[\s\S]{1,6}/g) ?? [DEMO_RESPONSE];
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 8));
        }
      } catch {
        /* stream dibatalkan pengguna */
      } finally {
        try {
          controller.close();
        } catch {
          /* noop */
        }
      }
    },
  });
  return new Response(stream, { headers: streamHeaders() });
}

/* ------------------------------------------------------------------ */
/*  Konversi SSE upstream -> teks biasa ke client                      */
/* ------------------------------------------------------------------ */

function sseToText(upstream: Response): ReadableStream<Uint8Array> {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let buffer = "";

  const pump = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    raw: string
  ) => {
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;

      try {
        const json = JSON.parse(data);
        const delta: string =
          json?.choices?.[0]?.delta?.content ??
          json?.choices?.[0]?.message?.content ??
          "";
        if (delta) controller.enqueue(encoder.encode(delta));
      } catch {
        /* potongan JSON belum lengkap — abaikan */
      }
    }
  };

  return new ReadableStream({
    async start(controller) {
      if (!upstream.body) {
        controller.enqueue(encoder.encode(DEMO_RESPONSE));
        controller.close();
        return;
      }

      reader = upstream.body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Provider non-streaming mengembalikan JSON utuh dalam satu payload
          if (buffer.trimStart().startsWith("{") && !buffer.includes("data:")) {
            if (buffer.length > 8 && buffer.trimEnd().endsWith("}")) {
              try {
                const json = JSON.parse(buffer);
                const text =
                  json?.choices?.[0]?.message?.content ??
                  json?.message?.content ??
                  "";
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                /* bukan JSON valid */
              }
              buffer = "";
              break;
            }
            continue;
          }

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          pump(controller, lines.join("\n"));
        }

        if (buffer.trim()) pump(controller, buffer);
      } catch (err) {
        try {
          controller.enqueue(
            encoder.encode(`\n\n> ⚠️ Koneksi stream terputus: ${describeError(err)}`)
          );
        } catch {
          /* controller sudah ditutup */
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* noop */
        }
      }
    },
    cancel() {
      reader?.cancel().catch(() => undefined);
    },
  });
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat                                                     */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  /* 1. Validasi payload ------------------------------------------------ */
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("Payload JSON tidak valid.", 400);
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const history: IncomingMessage[] = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return jsonError("Pesan terakhir harus dari user.", 400);
  }

  const files = (Array.isArray(body.files) ? body.files : [])
    .filter((f) => f && typeof f.content === "string" && typeof f.name === "string")
    .slice(0, MAX_FILE_IN_MSG);

  if (files.length > 0) {
    const last = history[history.length - 1];
    last.content = `${last.content}\n\n${renderAttachments(files)}`;
  }

  const messages = trimHistory(history);

  /* 2. Konfigurasi provider ------------------------------------------- */
  const baseUrl = (
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  const model = process.env.CTF_MODEL || "gpt-4o-mini";
  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);
  const apiKey = process.env.OPENAI_API_KEY || (isLocal ? "ollama" : "");

  // Mode demo: aplikasi tetap hidup walau API key belum diisi.
  if (!apiKey) return demoStream();

  const payload = {
    model,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    stream: true,
    temperature: 0.2,
  };

  const callUpstream = (bodyObj: Record<string, unknown>) =>
    fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyObj),
      signal: req.signal,
      cache: "no-store",
    });

  /* 3. Panggil provider ------------------------------------------------ */
  let upstream: Response;
  try {
    upstream = await callUpstream(payload);
  } catch (err) {
    return jsonError(
      `Tidak bisa menghubungi provider AI (${baseUrl}): ${describeError(err)}`,
      502
    );
  }

  // Beberapa model (o-series dsb.) menolak parameter `temperature`.
  if (upstream.status === 400) {
    const detail = await upstream.text().catch(() => "");
    if (/temperature|unsupported/i.test(detail)) {
      try {
        upstream = await callUpstream({
          model: payload.model,
          messages: payload.messages,
          stream: true,
        });
      } catch (err) {
        return jsonError(`Gagal memanggil ulang provider: ${describeError(err)}`, 502);
      }
    } else {
      return jsonError(
        `Provider menolak request (400): ${detail.slice(0, 400)}`,
        400
      );
    }
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    const hint =
      upstream.status === 401 || upstream.status === 403
        ? " → periksa OPENAI_API_KEY di .env.local"
        : upstream.status === 404
          ? " → periksa CTF_MODEL / OPENAI_BASE_URL"
          : "";
    return jsonError(
      `Provider merespons ${upstream.status}${hint}: ${detail.slice(0, 400)}`,
      502
    );
  }

  if (!upstream.body) {
    return jsonError("Provider tidak mengirim body respons.", 502);
  }

  /* 4. Stream jawaban ke client --------------------------------------- */
  return new Response(sseToText(upstream), { headers: streamHeaders() });
}