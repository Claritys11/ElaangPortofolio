import { ImageResponse } from "next/og";

export const alt = "Elang Dimas Syadewa (Claritys) — pwn-focused CTF writeups and projects";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0E0E0C", color: "#EDEBE6" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#9a978f" }}>
          <span style={{ color: "#FF5B1F" }}>0x00</span>&nbsp;/ CLARITYS
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 168, fontWeight: 900, letterSpacing: -6, lineHeight: 0.9 }}>ELANG</div>
          <div style={{ fontSize: 84, fontWeight: 300, letterSpacing: -2, lineHeight: 1 }}>DIMAS SYADEWA</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, borderTop: "2px solid #2a2925", paddingTop: 28 }}>
          <span style={{ letterSpacing: 4 }}>pwn · rev · forensics</span>
          <span style={{ color: "#FF5B1F" }}>claritys.web.id</span>
        </div>
      </div>
    ),
    size,
  );
}
