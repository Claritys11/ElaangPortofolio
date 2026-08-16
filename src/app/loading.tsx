import { SystemLoader } from "@/components/SystemLoader"

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SystemLoader
        size="page"
        message="Loading portfolio route"
        detail="Preparing the requested interface without delaying navigation."
      />
    </main>
  )
}
