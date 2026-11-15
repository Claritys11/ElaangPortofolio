import { ActivityHeatmap } from "@/components/site/activity-heatmap";
import { countByDay, resolveGithubActivityUsername } from "@/lib/activity";
import { getGithubDays } from "@/lib/data/activity";

type Props = { writeupDates: (string | null)[]; achievementDates: (string | null)[]; githubUrl: string | null; githubActivityUsername?: string | null };

/** CTF activity comes from local content; GitHub contributions are snapshotted during static builds. */
export async function ActivitySection({ writeupDates, achievementDates, githubUrl, githubActivityUsername }: Props) {
  const user = resolveGithubActivityUsername(githubActivityUsername, githubUrl);
  const github = await getGithubDays(user);
  const ctf = [...countByDay([...writeupDates, ...achievementDates])];
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
