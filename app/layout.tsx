import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoCTF Solver // Cyber Security Chatbot",
  description:
    "Chatbot AI khusus Cyber Security & AutoCTF Solver. Analisis soal CTF (Web, Crypto, Forensics, Reverse, Pwn, OSINT), langkah penyelesaian step-by-step, dan script solver instan.",
  keywords: ["CTF", "cyber security", "AutoCTF", "solver", "chatbot", "exploit", "writeup"],
};

export const viewport: Viewport = {
  themeColor: "#050706",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${jetbrains.variable} dark`}>
      <body className="min-h-screen bg-ink-950 font-mono text-body antialiased">
        {children}
      </body>
    </html>
  );
}
