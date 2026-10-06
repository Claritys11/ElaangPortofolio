export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="page-wipe" aria-hidden />
      {children}
    </>
  );
}
