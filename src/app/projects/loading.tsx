import { SystemLoader } from "@/components/SystemLoader"

export default function ProjectsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SystemLoader
        size="page"
        message="Loading technical projects"
        detail="Fetching project records for the showcase grid."
      />
    </div>
  )
}
