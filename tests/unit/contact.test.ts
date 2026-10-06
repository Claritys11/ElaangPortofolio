import { describe, expect, it } from "vitest";
import { ContactSchema, formatContactMessage } from "@/lib/contact";

describe("contact", () => {
  it("formats in the legacy shape", () => {
    expect(formatContactMessage({ name: "Rin", contact: "rin@x.dev", message: "Let's team up for SCTF" })).toEqual({
      title: "Message from Rin",
      content: "From: Rin (rin@x.dev)\n\nLet's team up for SCTF",
      username: "Rin",
      source: "contact-form",
    });
    expect(formatContactMessage({ name: "Rin", contact: "@rin", subject: "CTF team", message: "0123456789" }).title).toBe("CTF team");
  });
  it("validates lengths", () => {
    expect(ContactSchema.safeParse({ name: "", contact: "x", message: "short" }).success).toBe(false);
    expect(ContactSchema.safeParse({ name: "a", contact: "abc", message: "x".repeat(4001) }).success).toBe(false);
    expect(ContactSchema.safeParse({ name: "a", contact: "abc", message: "long enough message" }).success).toBe(true);
  });
});
