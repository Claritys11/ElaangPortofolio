"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROOF_SCORE_GUIDE, suggestProofScore } from "@/lib/achievements";

/** Proof score input with the scoring guide and a title-based suggestion. */
export function ProofScoreField({ defaultValue, titleInputId = "title" }: { defaultValue?: number | null; titleInputId?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input ref={ref} id="proofScore" name="proofScore" type="number" min={0} max={10} placeholder="auto" defaultValue={defaultValue ?? ""} className="w-28" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9"
          onClick={() => {
            const title = (document.getElementById(titleInputId) as HTMLInputElement | null)?.value ?? "";
            const s = suggestProofScore(title);
            if (ref.current) ref.current.value = String(s.score);
            setHint(`Suggested ${s.score}: ${s.reason}`);
          }}
        >
          Suggest from title
        </Button>
      </div>
      {hint && <p className="text-xs text-primary">{hint}</p>}
      <details className="rounded-md border border-border px-3 py-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Scoring guide (0–10)</summary>
        <table className="mt-2 w-full">
          <tbody>
            {PROOF_SCORE_GUIDE.map((g) => (
              <tr key={g.range} className="border-t border-border">
                <td className="py-1.5 pr-3 font-mono whitespace-nowrap">{g.range}</td>
                <td className="py-1.5 pr-3">{g.use}</td>
                <td className="py-1.5 text-muted-foreground">{g.shows}</td>
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="py-1.5 pr-3 font-mono">empty</td>
              <td className="py-1.5 pr-3">Auto from the title (Finalist / Top N / Rank / Medal / Juara 1-3 show large)</td>
              <td className="py-1.5 text-muted-foreground">—</td>
            </tr>
          </tbody>
        </table>
      </details>
    </div>
  );
}
