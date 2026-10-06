export function SectionLabel({ index, name, className = "" }: { index: number; name: string; className?: string }) {
  return (
    <p className={`meta ${className}`}>
      <span className="text-primary">0x{index.toString(16).padStart(2, "0").toUpperCase()}</span> / {name}
    </p>
  );
}
