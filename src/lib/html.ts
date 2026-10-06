import rehypeShiki from "@shikijs/rehype";
import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import type { BundledLanguage } from "shiki";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

const schema: SanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-[\w+#-]+$/]],
    img: ["src", "alt", "title", "width", "height"],
    td: ["colSpan", "rowSpan"],
    th: ["colSpan", "rowSpan"],
  },
};

// Legacy content: in-article <h1>s compete with the page title, and Notion imports carry the
// code language on <pre data-notion-code-syntax> (stripped by the sanitizer) instead of a class.
function normalizeLegacy() {
  return (tree: Root) =>
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "h1") node.tagName = "h2";
      const lang = node.tagName === "pre" ? String(node.properties?.dataNotionCodeSyntax ?? "").toLowerCase() : "";
      if (lang && /^[\w+#-]+$/.test(lang)) {
        const code = node.children.find((c): c is Element => c.type === "element" && c.tagName === "code");
        if (code && !code.properties?.className) code.properties = { ...code.properties, className: [`language-${lang}`] };
      }
    });
}

function externalLinks() {
  return (tree: Root) =>
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = String(node.properties?.href ?? "");
      if (/^https?:\/\//i.test(href)) node.properties = { ...node.properties, rel: ["noopener", "noreferrer"], target: "_blank" };
    });
}

function collectToc() {
  return (tree: Root, file: VFile) => {
    const toc: TocItem[] = [];
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties?.id) {
        toc.push({ id: String(node.properties.id), text: toString(node).trim(), depth: node.tagName === "h2" ? 2 : 3 });
      }
    });
    file.data.toc = toc;
  };
}

function lazyImages() {
  return (tree: Root) =>
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") node.properties = { ...node.properties, loading: "lazy", decoding: "async" };
    });
}

// Preloading all ~200 bundled grammars costs ~7s cold; preload what CTF writeups use and lazy-load the rest.
const PRELOAD_LANGS: BundledLanguage[] = ["c", "cpp", "python", "shellscript", "asm", "javascript", "typescript", "json", "php", "sql", "html", "diff", "go", "rust", "java", "powershell", "yaml"];

// Built once per process: the Shiki highlighter is reused across renders.
const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(normalizeLegacy)
  .use(rehypeSanitize, schema)
  .use(rehypeSlug)
  .use(collectToc)
  .use(externalLinks)
  .use(lazyImages)
  .use(rehypeShiki, {
    themes: { light: "github-light", dark: "vesper" },
    defaultColor: false,
    fallbackLanguage: "text",
    addLanguageClass: true,
    langs: PRELOAD_LANGS,
    lazy: true,
  })
  .use(rehypeStringify);

export async function renderWriteupHtml(input: string) {
  const file = await processor.process(input);
  return { html: String(file), toc: (file.data.toc as TocItem[] | undefined) ?? [] };
}

// Same legacy rewrites, unsanitized, for the admin editor: Tiptap drops <h1> (levels 2–4) and the
// Notion language attribute, so editing an old writeup would otherwise degrade it on save.
const legacyProcessor = unified().use(rehypeParse, { fragment: true }).use(normalizeLegacy).use(rehypeStringify);

export async function normalizeLegacyHtml(input: string): Promise<string> {
  return String(await legacyProcessor.process(input));
}
