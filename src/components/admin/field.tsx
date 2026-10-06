import { Label } from "@/components/ui/label";

export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string[]; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error?.[0] && <p className="text-sm text-destructive">{error[0]}</p>}
    </div>
  );
}
