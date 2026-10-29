# 🛡️ AutoCTF Solver — Cyber Security Chatbot

Chatbot web interaktif bergaya **cyber terminal** khusus **Cyber Security & AutoCTF Solver**.
Terima soal CTF (Web, Crypto, Forensics, Reverse, Pwn, OSINT, Misc) → AI menganalisis,
memberi langkah penyelesaian *step-by-step*, lalu menampilkan **script solver / payload**
dalam code block rapi bertombol **COPY**, plus dukungan **upload file soal**.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · OpenAI-compatible API
(dipilih karena *satu project = satu command deploy*, UI paling bebas untuk tema cyber,
dan streaming + file upload berada di satu tempat).

---

## ✅ Fitur

| Fitur | Keterangan |
| --- | --- |
| 🖥️ Dark cyber terminal theme | Background hitam kehijauan, aksen neon hijau `#00ff9c` + neon biru `#00e5ff`, font JetBrains Mono, grid & scanline halus |
| 📚 Sidebar riwayat chat | Daftar sesi, judul otomatis, waktu relatif, hapus sesi, status koneksi API (live/demo) — tersimpan di `localStorage` |
| 🤖 System prompt khusus | `AutoCTF Solver & Security Expert` dengan format jawaban wajib: `Analisis → Langkah → Solver → Flag` |
| 🧠 Streaming jawaban | Token muncul real-time via Server-Sent Events (bisa dihentikan tombol **STOP**) |
| 🧾 Code block rapi | Syntax highlighting neon (highlight.js), info bahasa + jumlah baris, tombol **COPY**, tinggi maksimal agar rapi |
| 📎 File uploader | Ikon 📎 / drag & drop: `.txt .py .c .pcap .bin …` — file teks dikirim utuh, file biner diekstrak `strings` + `sha256` |
| ⚡ Demo mode | Tanpa API key, aplikasi tetap jalan dengan balasan contoh (untuk uji UI) |
| 🔌 Provider fleksibel | OpenAI, OpenRouter, Groq, Groq, Ollama (localhost) — semua endpoint kompatibel OpenAI |

---

## 📁 Struktur Folder

```
chatbot ai ctf/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # Backend: terima pesan + file, panggil AI, stream jawaban
│   │   └── health/route.ts      # Status API key & model (untuk indikator sidebar)
│   ├── globals.css              # Tema global: Tailwind, prose cyber, tema highlight.js
│   ├── icon.svg                 # Favicon terminal
│   ├── layout.tsx               # Root layout + font JetBrains Mono
│   └── page.tsx                 # Halaman utama
├── components/
│   ├── ChatApp.tsx              # State utama: sesi, streaming, riwayat, drag & drop
│   ├── ChatInput.tsx            # Kolom input auto-grow, lampiran, tombol kirim/stop
│   ├── CodeBlock.tsx            # Code block + tombol COPY
│   ├── EmptyState.tsx           # Layar awal + chip contoh soal
│   ├── MessageBubble.tsx        # Gelembung pesan + renderer Markdown
│   └── Sidebar.tsx              # Riwayat chat + status koneksi AI
├── lib/
│   ├── files.ts                 # Baca file: teks utuh / biner → strings + sha256
│   ├── storage.ts               # Persistensi localStorage + util format
│   ├── system-prompt.ts         # ★ System prompt AutoCTF Solver (edit di sini)
│   └── types.ts                 # Tipe data bersama
├── .env.local.example           # Template konfigurasi API
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Cara Menjalankan di Lokal

### 1. Prasyarat
- **Node.js 18.17+** (disarankan 20 LTS) → cek `node -v`
- Koneksi internet untuk `npm install`

### 2. Install dependency
```bash
npm install
```

### 3. Konfigurasi API key
```bash
# Windows (PowerShell)
Copy-Item .env.local.example .env.local

# macOS / Linux
cp .env.local.example .env.local
```

Lalu buka `.env.local` dan isi:

```env
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
CTF_MODEL=gpt-4o-mini
```

**Contoh provider lain:**

| Provider | `OPENAI_BASE_URL` | `CTF_MODEL` | API key |
| --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` / `gpt-4o` | wajib |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` | wajib |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | wajib |
| Ollama (lokal) | `http://localhost:11434/v1` | `llama3.1` | **tidak perlu** |

> Belum punya API key? Biarkan `.env.local` kosong — aplikasi berjalan dalam **DEMO MODE**
> sehingga UI, code block, dan upload file tetap bisa dicoba.

### 4. Jalankan development server
```bash
npm run dev
```
Buka **<http://localhost:3000>**.

### 5. Build produksi (opsional)
```bash
npm run build
npm start
```

---

## 🕹️ Cara Pakai

1. Klik **NEW SESSION** (atau langsung tempel soal di kolom input).
2. Tulis/tempel soal CTF, misal:
   > *Login form https://ctf.local/login menolak quote ganda, ada WAF sederhana. Beri payload SQLi + solver Python lengkap.*
3. Tekan **Enter** (Shift+Enter = baris baru) atau tombol **KIRIM**.
4. Jawaban muncul streaming: `🎯 Analisis → 🧭 Langkah → 🛠️ Solver → 🚩 Flag`.
5. Klik **COPY** pada code block untuk menyalin script, lalu jalankan di terminal kamu.
6. Untuk soal berbasis file: klik 📎 (atau **drag & drop** file ke area chat).
   - File teks (`.txt`, `.py`, `.c`) → isi lengkap dibaca AI (maks 40 ribu karakter).
   - File biner (`.pcap`, `.bin`, `.exe`) → otomatis diekstrak *printable strings* + `sha256`.

---

## 🎨 Kustomisasi Cepat

| Ingin mengubah… | File |
| --- | --- |
| Gaya/jawaban AI, format output, aturan bahasa | `lib/system-prompt.ts` |
| Warna neon, font, bayangan | `tailwind.config.ts` |
| Gaya markdown, code block, syntax highlighting | `app/globals.css` |
| Batas ukuran/jumlah file | `lib/files.ts` |
| Contoh soal di layar awal | `components/EmptyState.tsx` |
| Batas konteks riwayat yang dikirim ke AI | `app/api/chat/route.ts` (`MAX_HISTORY_CHARS`) |

---

## 🌐 Deploy

### Vercel (paling mudah)
```bash
npm i -g vercel
vercel
```
Tambahkan environment variable `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `CTF_MODEL`
di dashboard Vercel → *Settings → Environment Variables*, lalu `vercel --prod`.

### Docker / VPS biasa
```bash
npm run build
npm start          # listen di port 3000 (atau set PORT=8080)
```

---

## 🔧 Troubleshooting

| Gejala | Solusi |
| --- | --- |
| Badge sidebar kuning `DEMO MODE` | `OPENAI_API_KEY` belum terbaca → isi `.env.local`, **restart** `npm run dev` |
| `Provider merespons 401` | API key salah/expired |
| `Provider merespons 404` | `CTF_MODEL` atau `OPENAI_BASE_URL` salah |
| `Provider merespons 429` | Kuota/rate limit provider |
| Muncul `⚠️ Koneksi stream terputus` | Internet/provider bermasalah — kirim ulang pesan |
| File tidak terbaca | Ukuran > 10 MB atau melebihi 5 file per pesan |
| Port 3000 terpakai | `npm run dev -- -p 3001` |

---

## ⚖️ Catatan Etika

System prompt membatasi penggunaan untuk **CTF, lab, TryHackMe/HTB, pentest yang
di-otorisasi, dan defensive security**. Permintaan menyerang sistem pihak ketiga
tanpa izin akan ditolak oleh model.

Gunakan hanya pada tantangan dan infrastruktur yang berizin.
