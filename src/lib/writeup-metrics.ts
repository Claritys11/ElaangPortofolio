export interface WriteupStats {
  wordCount: number;
  readingMinutes: number;
}

const WORDS_PER_MINUTE = 220;

export function stripHtml(value: string | undefined): string {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function getWriteupStats(content: string | undefined, fallbackText?: string): WriteupStats {
  const plainText = stripHtml(content || fallbackText);
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  return {
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
  };
}

export function formatWriteupDate(value: string | undefined): string {
  if (!value) {
    return "Undated";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.split(/[T ]/)[0] || value;
  }

  return parsed.toISOString().slice(0, 10);
}
