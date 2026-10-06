"use client";

import { X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { suggestTags, tagKey, type TagStat } from "@/lib/tags";
import { cn } from "@/lib/utils";

type Props = { name: string; defaultValue?: string[]; index: TagStat[]; category: string | null };

export function TagInput({ name, defaultValue = [], index, category }: Props) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const canonical = useMemo(() => new Map(index.map((t) => [tagKey(t.tag), t.tag])), [index]);
  const suggestions = suggestTags(index, { query, category, selected: tags, limit: 8 });
  const q = query.trim().replace(/,$/, "");
  const isNew = q.length > 0 && !canonical.has(tagKey(q)) && !tags.some((t) => tagKey(t) === tagKey(q));
  // Existing matches first so Enter picks "heap" for "he"; comma always commits exactly what was typed.
  const options: { label: string; value: string; count?: number; fresh?: boolean }[] = [
    ...suggestions.map((s) => ({ label: s.tag, value: s.tag, count: s.count })),
    ...(isNew ? [{ label: `+ new tag “${q}”`, value: q, fresh: true }] : []),
  ];
  const popular = suggestTags(index, { query: "", category, selected: tags, limit: 6 });
  // The dropdown is for typing; with an empty input the "Popular" row below does the suggesting.
  const showList = open && q.length > 0 && options.length > 0;

  function add(raw: string) {
    const t = raw.trim().replace(/,$/, "").slice(0, 40);
    if (!t || tags.some((x) => tagKey(x) === tagKey(t)) || tags.length >= 30) return;
    setTags([...tags, canonical.get(tagKey(t)) ?? t]);
    setQuery("");
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (options.length ? (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : 0));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (showList && options[active] && e.key === "Enter") add(options[active].value);
      else add(q);
    } else if (e.key === "Backspace" && !query && tags.length) {
      setTags(tags.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div
        className="relative flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/50"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs">
            {t}
            <button type="button" aria-label={`Remove tag ${t}`} className="text-muted-foreground hover:text-foreground" onClick={() => setTags(tags.filter((x) => x !== t))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={name}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${name}-listbox`}
          aria-autocomplete="list"
          value={query}
          placeholder={tags.length ? "" : "type a tag…"}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        {showList && (
          <ul id={`${name}-listbox`} role="listbox" className="absolute top-full left-0 z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg">
            {options.map((o, i) => (
              <li
                key={`${o.value}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(o.value);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm", i === active && "bg-secondary", o.fresh && "text-primary")}
              >
                <span className="font-mono">{o.label}</span>
                {o.count !== undefined && <span className="text-xs text-muted-foreground">{o.count}×</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {popular.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{category ? `Popular in ${category}:` : "Popular:"}</span>
          {popular.map((t) => (
            <button
              key={t.tag}
              type="button"
              onClick={() => add(t.tag)}
              className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              + {t.tag}
            </button>
          ))}
        </div>
      )}
      <input type="hidden" name={name} value={tags.join(", ")} />
    </div>
  );
}
