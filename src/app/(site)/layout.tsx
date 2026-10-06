import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Nav } from "@/components/site/nav";
import { getProfile } from "@/lib/data/profile";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <SmoothScroll>
      <Nav brand={profile.brand} />
      <div id="content" className="relative z-10 bg-background">
        {children}
      </div>
      {/* footer: Task 8 */}
    </SmoothScroll>
  );
}
