import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint kecil untuk menampilkan status koneksi AI di sidebar.
 * configured = false  -> aplikasi tetap jalan dalam mode DEMO.
 */
export async function GET(_req: NextRequest) {
  const baseUrl = (
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");

  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);
  const configured = Boolean(process.env.OPENAI_API_KEY) || isLocal;

  return Response.json({
    configured,
    model: process.env.CTF_MODEL || "gpt-4o-mini",
    provider: baseUrl.replace(/^https?:\/\//, ""),
  });
}
