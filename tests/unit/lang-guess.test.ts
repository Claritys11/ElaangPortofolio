import { describe, expect, it } from "vitest";
import { guessLanguage } from "@/lib/lang-guess";

describe("guessLanguage", () => {
  it.each([
    ["#include <stdio.h>\nint main(void) { return 0; }", "c"],
    ["#!/usr/bin/env python3\nfrom pwn import *\nexe = './truman'", "python"],
    ["import struct\ndef leak(x):\n    return x", "python"],
    ["~/ctf/beectf/pwn/trumanshow\n❯ python3 solve.py --remote 1.2.3.4 6007", "bash"],
    ["$ checksec ./vuln\n    Arch: amd64-64-little", "bash"],
    ["<?php echo $_GET['x']; ?>", "php"],
    ["const a = 1;\nconsole.log(a)", "javascript"],
    ["mov rax, 0x3b\nxor rsi, rsi\nsyscall", "asm"],
  ])("detects %#", (code, lang) => {
    expect(guessLanguage(code)).toBe(lang);
  });
  it("returns null for plain output it cannot classify", () => {
    expect(guessLanguage("00000000: 52f2 aa69 0000  R..i....")).toBeNull();
    expect(guessLanguage("BeeCTF{flag_here}")).toBeNull();
  });
});

import { renderWriteupHtml } from "@/lib/html";

describe("pipeline uses the guess only when no language is set", () => {
  it("labels and highlights an unlabelled C block, keeps explicit languages", async () => {
    const { html } = await renderWriteupHtml("<pre><code>#include &lt;stdio.h&gt;\nint main(){}</code></pre><pre><code class=\"language-rust\">fn main(){}</code></pre>");
    expect(html).toContain('<span class="code-lang">c</span>');
    expect(html).toContain('<span class="code-lang">rust</span>');
  });
});
