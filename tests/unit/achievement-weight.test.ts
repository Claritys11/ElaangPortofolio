import { describe, expect, it } from "vitest";
import { achievementWeight, emphasisFor } from "@/lib/achievements";

const a = (title: string, proofScore: number | null) => ({ title, proofScore });

describe("achievement emphasis", () => {
  it("explicit proof score wins (0–10 scale)", () => {
    expect(achievementWeight(a("VishwaCTF 2026 Participant", 8))).toBe(8);
    expect(achievementWeight(a("Finalist Jatim Cybersecurity Competition (JCC)", 6))).toBe(6);
    expect(achievementWeight(a("IELTS Try Out – Listening & Reading (Score: 6)", 4))).toBe(4);
  });
  it("without a score, ranked results count as notable and participation does not", () => {
    for (const t of ["Junior Crypt CTF 2026 – Rank #75 (International)", "Top 25 CTF FGTE 0", "Awarded Gold Medal in Mathematics with A+ Distinction", "Juara 2 LKS", "Winner of X", "Finalist Y"]) {
      expect(achievementWeight(a(t, null))).toBe(5);
    }
    for (const t of ["HackerVerse Monthly CTF Participant", "Participant Techcomfest CTF Competition 2026", "Introduction to Amazon EC2 (AWS Training & Certification)"]) {
      expect(achievementWeight(a(t, null))).toBe(0);
    }
  });
  it("maps weight to a size tier", () => {
    expect(emphasisFor(9)).toBe("xl");
    expect(emphasisFor(7)).toBe("xl");
    expect(emphasisFor(6)).toBe("lg");
    expect(emphasisFor(4)).toBe("lg");
    expect(emphasisFor(3)).toBe("base");
    expect(emphasisFor(0)).toBe("base");
  });
});
