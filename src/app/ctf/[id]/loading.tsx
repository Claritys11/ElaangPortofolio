import { SystemLoader } from "@/components/SystemLoader"

export default function WriteupLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:py-20">
      <SystemLoader
        size="page"
        message="Loading write-up detail"
        detail="Fetching challenge metadata and documentation."
      />
    </div>
  )
}
