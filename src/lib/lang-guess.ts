/**
 * Best-effort language for legacy code blocks that were saved without one.
 * Order matters: a shell session that runs `python3 solve.py` is still a shell session.
 */
const RULES: [string, RegExp][] = [
  ["bash", /(^|\n)\s*(❯|\$ |┌─|└─|~\/|#\s*(sudo|apt|nc|gdb|checksec|python3?)\b)/],
  ["php", /<\?php/],
  ["c", /#include\s*[<"]|\bint\s+main\s*\(/],
  ["python", /(^|\n)\s*(from\s+[\w.]+\s+import\b|import\s+[\w.]+\s*$|def\s+\w+\(|#!\/usr\/bin\/env python)/m],
  ["javascript", /\b(const|let)\s+\w+\s*=|console\.log\(|=>\s*\{/],
  ["asm", /(^|\n)\s*(mov|push|pop|lea|xor|syscall|ret|call|jmp)\b[^\n]*\n[\s\S]*(^|\n)\s*(mov|push|pop|lea|xor|syscall|ret|call|jmp)\b/],
];

export function guessLanguage(code: string): string | null {
  for (const [lang, re] of RULES) if (re.test(code)) return lang;
  return null;
}
