"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Column = { key: string; label: string; type?: "text" | "number" | "textarea" };
type Row = Record<string, string | number>;

export function ListEditor({ name, columns, defaultValue }: { name: string; columns: Column[]; defaultValue: Row[] }) {
  const [rows, setRows] = useState<Row[]>(defaultValue);
  const update = (i: number, key: string, value: string, type?: Column["type"]) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [key]: type === "number" ? Number(value) : value } : r)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    const [r] = next.splice(i, 1);
    next.splice(i + d, 0, r);
    setRows(next);
  };
  return (
    <div className="grid gap-3">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-border p-3">
          <div className="grid gap-2 md:grid-cols-3">
            {columns.map((c) =>
              c.type === "textarea" ? (
                <Textarea
                  key={c.key}
                  aria-label={c.label}
                  placeholder={c.label}
                  className="md:col-span-3"
                  value={String(r[c.key] ?? "")}
                  onChange={(e) => update(i, c.key, e.target.value)}
                />
              ) : (
                <Input
                  key={c.key}
                  aria-label={c.label}
                  placeholder={c.label}
                  type={c.type ?? "text"}
                  value={String(r[c.key] ?? "")}
                  onChange={(e) => update(i, c.key, e.target.value, c.type)}
                />
              ),
            )}
          </div>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
              ↑
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
              ↓
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
              remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        onClick={() => setRows([...rows, Object.fromEntries(columns.map((c) => [c.key, c.type === "number" ? 0 : ""]))])}
      >
        Add row
      </Button>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
    </div>
  );
}
