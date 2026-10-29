import { describe, expect, it } from "vitest";
import { evidenceFor, shortTitle, SYSADMIN, WEBDEV } from "@/lib/focus";

// Shaped like the live projects list (admin order).
const projects = [
  { title: "DAS Badung — Interactive Flood Story", category: "Interactive Journalism", tags: ["React", "TypeScript", "MapLibre"] },
  { title: "CachyOS + niri — Daily-Driver Linux Desktop", category: "Linux Setup", tags: ["CachyOS", "Arch Linux", "niri", "Wayland"] },
  { title: "Islet — Dynamic Island for Linux", category: "Open Source", tags: ["Quickshell", "QML", "Wayland", "Linux"] },
  { title: "Homelab — Self-Hosted Deployment Platform", category: "Infrastructure", tags: ["Coolify", "Docker", "Traefik", "Cloudflare Tunnel", "systemd-nspawn", "CachyOS"] },
  { title: "Internext — XI International Class Hub", category: "Web Platform", tags: ["Next.js 16", "GSAP", "Prisma", "PostgreSQL", "CMS"] },
  { title: "E-Pilketos — School Council E-Voting", category: "Web Application", tags: ["Next.js 16", "Auth.js", "Prisma", "PostgreSQL", "Docker"] },
  { title: "DevSecOps Dashboard", category: "Security Tooling", tags: ["DevSecOps", "Dashboard", "Monitoring", "Homelab"] },
];

describe("evidenceFor", () => {
  it("ranks sysadmin projects by matched terms, leaving out Linux desktop work", () => {
    expect(evidenceFor(projects, SYSADMIN).map((p) => shortTitle(p.title))).toEqual(["Homelab", "DevSecOps Dashboard", "CachyOS + niri"]);
  });
  it("ranks web projects the same way", () => {
    expect(evidenceFor(projects, WEBDEV).map((p) => shortTitle(p.title))).toEqual(["Internext", "E-Pilketos", "DAS Badung"]);
  });
  it("returns nothing when no project matches", () => {
    expect(evidenceFor([{ title: "x", category: "CTF", tags: ["Forensic"] }], SYSADMIN)).toEqual([]);
  });
});

describe("shortTitle", () => {
  it("drops the subtitle after a dash", () => {
    expect(shortTitle("Homelab — Self-Hosted Deployment Platform")).toBe("Homelab");
    expect(shortTitle("DevSecOps Dashboard")).toBe("DevSecOps Dashboard");
  });
});
