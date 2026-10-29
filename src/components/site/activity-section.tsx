import { ActivityHeatmap } from "@/components/site/activity-heatmap";
import { countByDay, githubUser } from "@/lib/activity";
import { getGithubDays } from "@/lib/data/activity";

type Props = { writeupDates: (string | null)[]; achievementDates: (string | null)[]; githubUrl: string | null };

/** CTF activity from the site's own data, plus GitHub when its public calendar is reachable. Streamed, so GitHub never delays the page. */
export async function ActivitySection({ writeupDates, achievementDates, githubUrl }: Props) {
  const github = await getGithubDays(githubUrl);
  const ctf = [...countByDay([...writeupDates, ...achievementDates])];
  const user = githubUser(githubUrl);
  return (
    <ActivityHeatmap
      today={new Date().toISOString()}
      sources={[
        { key: "ctf", label: "CTF", noun: "writeups & results", days: ctf, href: "/writeups", handle: "all writeups" },
        ...(github && user
          ? [{ key: "github" as const, label: "GitHub", noun: "contributions", days: github, href: `https://github.com/${user}`, handle: `@${user}`, external: true }]
          : []),
      ]}
    />
  );
}
