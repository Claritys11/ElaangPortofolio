import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";
import { getWriteup } from "@/lib/data/writeups";
import { formatDate } from "@/lib/format";

export const alt = "CTF writeup by Elang Dimas Syadewa (Claritys)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const w = await getWriteup((await params).slug);
  const title = w?.title ?? "Writeup";
  const meta = w ? [w.competition, w.difficulty, formatDate(w.date)].filter(Boolean).join("  ·  ") : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0E0E0C", color: "#EDEBE6", fontFamily: "Archivo" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 28, letterSpacing: 6 }}>
          <span style={{ background: "#FF5B1F", color: "#0E0E0C", padding: "8px 20px", fontWeight: 700 }}>{(w?.category ?? "CTF").toUpperCase()}</span>
          <span style={{ color: "#9a978f" }}>WRITEUP</span>
        </div>
        <div style={{ display: "flex", fontSize: title.length > 28 ? 92 : 128, fontWeight: 900, letterSpacing: -4, lineHeight: 0.95 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, borderTop: "2px solid #2a2925", paddingTop: 28 }}>
          <span style={{ color: "#9a978f" }}>{meta}</span>
          <span>
            Elang Dimas Syadewa&nbsp;·&nbsp;<span style={{ color: "#FF5B1F" }}>claritys.web.id</span>
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
