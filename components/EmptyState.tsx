"use client";

const SUGGESTIONS = [
  {
    tag: "WEB",
    tone: "neon",
    text: "Form login https://ctf.local/login rentan SQL injection (tahan quote ganda). Beri payload bypass + solver Python requests lengkap.",
  },
  {
    tag: "CRYPTO",
    tone: "ice",
    text: "RSA common modulus: N sama, e=3 dan e=7, dua ciphertext. Analisis matematis + script solver sampai keluar plaintext.",
  },
  {
    tag: "PWN",
    tone: "neon",
    text: "ret2win buffer overflow (no canary, NX on, no PIE). Cara cari offset + exploit pwntools utuh yang bisa langsung jalan.",
  },
  {
    tag: "FORENSIC",
    tone: "ice",
    text: "Ada file capture.pcap berisi HTTP traffic mencurigakan. Urutan analisis + perintah tshark/script Python untuk ekstrak flag.",
  },
  {
    tag: "REVERSE",
    tone: "neon",
    text: "Binary crackme x86_64 dengan fungsi check_serial. Rencana reverse engineering + script z3/angr untuk menemukan serial.",
  },
  {
    tag: "OSINT",
    tone: "ice",
    text: "Telusuri jejak digital username 'ctfplayer123' — Google dorking, tool, dan laporan hasil terstruktur.",
  },
];

export default function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col justify-center px-4 py-10">
      {/* Judul */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-[0.18em] text-neon text-glow sm:text-4xl">
          AUTOCTF
        </h1>
        <h2 className="mt-1 text-lg font-light tracking-[0.42em] text-ice text-glow-ice sm:text-xl">
          SOLVER
        </h2>
        <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-body/80">
          Chatbot keamanan siber khusus CTF. Tempel soalnya — dapat analisis,
          langkah penyelesaian <span className="text-neon">step-by-step</span>,
          dan script solver siap pakai tanpa bertele-tele.
        </p>
      </div>

      {/* Terminal boot */}
      <div className="panel scanlines mb-6 rounded-md px-4 py-3 font-mono text-[11.5px] leading-relaxed">
        <p className="text-muted">
          <span className="text-neon">root@autoctf</span>:~$ ./solver --init
        </p>
        <p className="text-body/70">
          <span className="text-ice">[+]</span> memuat modul: web · crypto ·
          forensics · reverse · pwn · osint{" "}
          <span className="text-neon">… ok</span>
        </p>
        <p className="text-body/70">
          <span className="text-ice">[+]</span> siap menerima input soal{" "}
          <span className="inline-block h-3 w-1.5 translate-y-0.5 bg-neon animate-blink" />
        </p>
      </div>

      {/* Chip kategori */}
      <div className="mb-3 flex items-center gap-3 text-[9.5px] tracking-[0.28em] text-muted">
        <span>CONTOH PERINTAH</span>
        <span className="h-px flex-1 bg-neon/15" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => onPick(item.text)}
            className={`group rounded-sm border bg-ink-850/70 px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-1 ${
              item.tone === "neon"
                ? "border-neon/20 hover:border-neon/60 hover:bg-neon/5 hover:shadow-neon focus-visible:ring-neon/60"
                : "border-ice/20 hover:border-ice/60 hover:bg-ice/5 hover:shadow-ice focus-visible:ring-ice/60"
            }`}
          >
            <span
              className={`block text-[10px] font-bold tracking-[0.25em] ${
                item.tone === "neon" ? "text-neon" : "text-ice"
              }`}
            >
              {item.tag}
            </span>
            <span className="mt-1 block text-[12px] leading-relaxed text-body/70 transition-colors group-hover:text-body/90">
              {item.text.length > 96 ? `${item.text.slice(0, 96)}…` : item.text}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-[10.5px] leading-relaxed tracking-wide text-muted">
        💡 Lampirkan file soal (<span className="text-neon">.txt · .py · .c · .pcap</span>)
        lewat ikon 📎 — file biner otomatis diekstrak menjadi strings + sha256.
      </p>
    </div>
  );
}
