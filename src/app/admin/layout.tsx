import { Toaster } from "@/components/ui/sonner";

/** Toasts are an admin affordance; keeping them here keeps their script and styles off public pages. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
