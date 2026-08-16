import { SystemLoader } from "@/components/SystemLoader"

export default function AchievementsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SystemLoader
        size="page"
        message="Loading achievements"
        detail="Fetching certifications, milestones, and quick stats."
      />
    </div>
  )
}
